import { useState, type SubmitEvent } from 'react'
import { ChevronDown, PanelTop, Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Empty,
  FormField,
  InlineError,
  Loading,
  Modal,
  ModalActions,
  ModalTitle,
  PageHeading,
  PanelTitle,
} from '@/components/ui'
import { durationLabel, formatPrice, SPORTS, WEEKDAYS } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/complexStore'
import { dashboardApi } from '@/lib/api'
import { useAction } from '@/lib/resource'
import type { FieldDraft, Sport } from '@/types/api'

type PriceDraft = { id: string; duration: string; price: string }

type TimeBlockDraft = {
  id: string
  dayOfWeek: number
  from: string
  to: string
  prices: PriceDraft[]
}

function createPrice(): PriceDraft {
  return { id: crypto.randomUUID(), duration: '01:00', price: '' }
}

function createTimeBlock(): TimeBlockDraft {
  return {
    id: crypto.randomUUID(),
    dayOfWeek: 1,
    from: '08:00',
    to: '22:00',
    prices: [createPrice()],
  }
}

const allSports = Object.keys(SPORTS) as Sport[]

export function FieldsPage() {
  const complex = useWorkspaceStore(state => state.complex)
  const fields = useWorkspaceStore(state => state.fields)
  const [creating, setCreating] = useState(false)
  const courts = fields.data ?? []
  const venue = complex.data
  const sports = venue?.sports.length ? venue.sports : allSports
  const subtitle =
    courts.length === 1 ? '1 cancha registrada' : courts.length + ' canchas registradas'

  const [blocks, setBlocks] = useState<TimeBlockDraft[]>([])
  const [validation, setValidation] = useState('')
  const createAction = useAction()

  function updateBlock(updated: TimeBlockDraft) {
    setBlocks(previous => previous.map(block => (block.id === updated.id ? updated : block)))
  }

  function removeBlock(id: string) {
    setBlocks(previous => previous.filter(block => block.id !== id))
  }

  function saveField(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!venue) return
    setValidation('')
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const invalidSchedule = blocks.some(
      block => block.from >= block.to || block.prices.some(price => price.duration === '00:00'),
    )

    if (!name || invalidSchedule) {
      setValidation(
        'Ingresa un nombre, franjas con hora de término posterior al inicio y duraciones mayores a cero.',
      )
      return
    }

    const field: FieldDraft = {
      name,
      type: form.get('type') as Sport,
      complexId: venue._id,
      availability: blocks.map(({ dayOfWeek, from, to, prices }) => ({
        dayOfWeek,
        from,
        to,
        prices: prices.map(({ duration, price }) => ({ duration, price: Number(price) })),
      })),
    }
    void createAction.run(
      async () => {
        await dashboardApi.createField(field)
        void fields.reload()
      },
      () => setCreating(false),
    )
  }

  function showCreateForm() {
    setBlocks([createTimeBlock()])
    setValidation('')
    createAction.reset()
    setCreating(true)
  }

  const error = complex.error || fields.error

  return (
    <div className="page">
      <PageHeading>
        <div>
          <h1>Canchas</h1>
          <p>Administra el listado de canchas, sus franjas y tarifas.</p>
        </div>
        {venue && (
          <Button onClick={showCreateForm}>
            <Plus size={18} /> Nueva cancha
          </Button>
        )}
      </PageHeading>
      {error && (
        <InlineError>
          <span>{error}</span>
          <Button
            className="button--secondary"
            onClick={complex.error ? complex.reload : fields.reload}
          >
            Reintentar
          </Button>
        </InlineError>
      )}
      {(complex.loading || fields.loading) && !fields.data && <Loading />}
      {fields.data &&
        (courts.length ? (
          <section>
            <PanelTitle>
              <div>
                <h2>Canchas del recinto</h2>
                <p>{subtitle}</p>
              </div>
            </PanelTitle>
            <div className="court-list">
              {courts.map(field => {
                const availability = field.availability ?? []
                return (
                  <article className="panel" key={field._id}>
                    <div className="court-card-heading">
                      <span className="section-icon">
                        <PanelTop size={20} />
                      </span>
                      <div>
                        <h2>{field.name}</h2>
                        <Badge className="badge--accent">{SPORTS[field.type] ?? field.type}</Badge>
                      </div>
                    </div>
                    <details>
                      <summary>
                        Horarios y tarifas <ChevronDown size={16} />
                      </summary>
                      {availability.length > 0 ? (
                        <ul className="schedule-list">
                          {availability.map((block, index) => (
                            <li key={index}>
                              <strong>
                                {WEEKDAYS[block.dayOfWeek]} · {block.from}–{block.to}
                              </strong>
                              <div className="chips">
                                {block.prices.map((price, priceIndex) => (
                                  <Badge key={priceIndex}>
                                    {durationLabel(price.duration)} · {formatPrice(price.price)}
                                  </Badge>
                                ))}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Empty>
                          <strong>Sin franjas configuradas</strong>
                        </Empty>
                      )}
                    </details>
                  </article>
                )
              })}
            </div>
          </section>
        ) : (
          <section className="panel">
            <Empty>
              <strong>Aún no tienes canchas</strong>
              <p>Crea una cancha e indica cuándo está disponible.</p>
            </Empty>
          </section>
        ))}

      {creating && venue && (
        <Modal aria-label="Nueva cancha" onClose={() => setCreating(false)}>
          <ModalTitle>Nueva cancha</ModalTitle>
          <form className="form-stack" onSubmit={saveField}>
            <div className="form-grid">
              <FormField>
                <span>Nombre de la cancha</span>
                <input name="name" required placeholder="Ej. Pádel Central" />
              </FormField>
              <FormField>
                <span>Deporte</span>
                <select name="type">
                  {sports.map(sport => (
                    <option key={sport} value={sport}>
                      {SPORTS[sport]}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="form-stack">
              {blocks.map((block, index) => {
                function update(change: Partial<TimeBlockDraft>) {
                  updateBlock({ ...block, ...change })
                }

                function updatePrice(id: string, change: Partial<PriceDraft>) {
                  update({
                    prices: block.prices.map(price =>
                      price.id === id ? { ...price, ...change } : price,
                    ),
                  })
                }

                function removePrice(id: string) {
                  update({ prices: block.prices.filter(price => price.id !== id) })
                }
                return (
                  <fieldset key={block.id}>
                    <legend>Franja {index + 1}</legend>
                    <div className="form-grid form-grid--three">
                      <FormField>
                        <span>Día</span>
                        <select
                          value={block.dayOfWeek}
                          onChange={event => update({ dayOfWeek: Number(event.target.value) })}
                        >
                          {WEEKDAYS.map((day, index) => (
                            <option value={index} key={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField>
                        <span>Desde</span>
                        <input
                          type="time"
                          required
                          value={block.from}
                          onChange={event => update({ from: event.target.value })}
                        />
                      </FormField>
                      <FormField>
                        <span>Hasta</span>
                        <input
                          type="time"
                          required
                          value={block.to}
                          onChange={event => update({ to: event.target.value })}
                        />
                      </FormField>
                    </div>

                    {block.prices.map(price => (
                      <div className="form-grid form-grid--price" key={price.id}>
                        <FormField>
                          <span>Duración (hh:mm)</span>
                          <input
                            type="time"
                            required
                            value={price.duration}
                            onChange={event =>
                              updatePrice(price.id, { duration: event.target.value })
                            }
                          />
                        </FormField>
                        <FormField>
                          <span>Tarifa (CLP)</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            required
                            value={price.price}
                            onChange={event => updatePrice(price.id, { price: event.target.value })}
                          />
                        </FormField>
                        {block.prices.length > 1 && (
                          <Button
                            className="button--quiet icon-button"
                            aria-label="Quitar tarifa"
                            onClick={() => removePrice(price.id)}
                          >
                            <Trash2 size={17} />
                          </Button>
                        )}
                      </div>
                    ))}

                    <div className="form-actions form-actions--between">
                      <Button
                        className="button--quiet"
                        onClick={() => update({ prices: [...block.prices, createPrice()] })}
                      >
                        <Plus size={16} /> Añadir tarifa
                      </Button>
                      {blocks.length > 1 && (
                        <Button className="button--quiet" onClick={() => removeBlock(block.id)}>
                          Quitar franja
                        </Button>
                      )}
                    </div>
                  </fieldset>
                )
              })}
            </div>
            <Button
              className="button--secondary"
              onClick={() => setBlocks(previous => [...previous, createTimeBlock()])}
            >
              <Plus size={17} /> Añadir franja
            </Button>

            <InlineError>{validation || createAction.error}</InlineError>
            <ModalActions>
              <Button type="submit" disabled={createAction.busy}>
                {createAction.busy ? 'Creando…' : 'Crear cancha'}
              </Button>
            </ModalActions>
          </form>
        </Modal>
      )}
    </div>
  )
}
