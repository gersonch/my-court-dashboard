import { useState, type ChangeEvent, type SubmitEvent } from 'react'
import { Building2, ImagePlus, MapPin, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Empty,
  InlineError,
  Loading,
  Modal,
  ModalActions,
  ModalTitle,
  PageHeading,
  PanelTitle,
} from '@/components/ui'
import { dashboardApi } from '@/lib/api'
import { useAction } from '@/lib/resource'
import { FACILITIES, SPORTS } from '@/lib/utils'
import { useWorkspaceStore } from '@/stores/complexStore'
import type { ComplexUpdate, Facility, Sport } from '@/types/api'

const sportKeys = Object.keys(SPORTS) as Sport[]
const facilityKeys = Object.keys(FACILITIES) as Facility[]
const MAX_PHOTO_SIZE = 500 * 1024

export function ComplexPage() {
  const complex = useWorkspaceStore(state => state.complex)
  const [editing, setEditing] = useState(false)
  const venue = complex.data
  const address = [venue?.address, venue?.city, venue?.region].filter(Boolean).join(', ')
  const facilities = facilityKeys.filter(key => venue?.facilities?.[key])
  const equipment = sportKeys.filter(key => venue?.equipment?.[key])

  const editAction = useAction()

  function saveComplex(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!venue) return
    const form = new FormData(event.currentTarget)
    const data: ComplexUpdate = {
      sports: sportKeys.filter(sport => form.has('sport-' + sport)),
      equipment: Object.fromEntries(
        sportKeys.map(sport => [sport, form.has('equipment-' + sport)]),
      ),
      facilities: Object.fromEntries(facilityKeys.map(key => [key, form.has('facility-' + key)])),
    }
    void editAction.run(
      async () => {
        await dashboardApi.updateComplex(data)
        void complex.reload()
      },
      () => setEditing(false),
    )
  }

  const [photoToDelete, setPhotoToDelete] = useState<string>()
  const [uploadError, setUploadError] = useState('')
  const photoAction = useAction()

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    setUploadError('')
    if (file.size > MAX_PHOTO_SIZE) {
      setUploadError('La imagen debe pesar como máximo 500 KB.')
      return
    }

    void photoAction.run(() => dashboardApi.uploadImage(file), complex.reload)
  }

  function confirmDelete(url: string) {
    photoAction.clear()
    setPhotoToDelete(url)
  }

  function closeConfirmation() {
    setPhotoToDelete(undefined)
  }

  function deletePhoto(url: string) {
    void photoAction.run(
      () => dashboardApi.deleteImage(url),
      () => {
        void complex.reload()
        closeConfirmation()
      },
    )
  }

  function showEditForm() {
    editAction.reset()
    setEditing(true)
  }

  return (
    <div className="page">
      <PageHeading>
        <div>
          <h1>Mi recinto</h1>
          <p>Consulta la información del recinto y gestiona lo que ofrece.</p>
        </div>
        {venue && <Button onClick={showEditForm}>Editar recinto</Button>}
      </PageHeading>
      {complex.error && (
        <InlineError>
          <span>{complex.error}</span>
          <Button className="button--secondary" onClick={complex.reload}>
            Reintentar
          </Button>
        </InlineError>
      )}
      {complex.loading && !venue && <Loading />}

      {venue && (
        <>
          <section className="panel venue-intro">
            <span className="section-icon section-icon--large">
              <Building2 size={25} />
            </span>
            <div>
              <h2>{venue.name}</h2>
              <p>{venue.description}</p>
              <span className="venue-address">
                <MapPin size={16} />
                {address}
              </span>
            </div>
          </section>

          <div className="overview-grid">
            <section className="panel">
              <PanelTitle>
                <div>
                  <h2>Deportes y equipamiento</h2>
                </div>
              </PanelTitle>
              <div className="subgroup">
                <h3>Deportes disponibles</h3>
                <div className="chips">
                  {venue.sports.length ? (
                    venue.sports.map(sport => (
                      <Badge className="badge--accent" key={sport}>
                        {SPORTS[sport] ?? sport}
                      </Badge>
                    ))
                  ) : (
                    <span className="muted">Sin deportes configurados</span>
                  )}
                </div>
              </div>
              <div className="subgroup">
                <h3>Equipamiento por deporte</h3>
                <div className="chips">
                  {equipment.length ? (
                    equipment.map(sport => <Badge key={sport}>{SPORTS[sport]}</Badge>)
                  ) : (
                    <span className="muted">Sin equipamiento configurado</span>
                  )}
                </div>
              </div>
            </section>

            <section className="panel">
              <PanelTitle>
                <div>
                  <h2>Instalaciones</h2>
                </div>
              </PanelTitle>
              <div className="chips">
                {facilities.length ? (
                  facilities.map(key => <Badge key={key}>{FACILITIES[key]}</Badge>)
                ) : (
                  <span className="muted">Sin instalaciones configuradas</span>
                )}
              </div>
            </section>
          </div>
          <section className="panel">
            <PanelTitle>
              <div>
                <h2>Fotos del recinto</h2>
                <p>JPG, PNG, GIF o WebP · Hasta 500 KB por imagen</p>
              </div>
              <label className="button button--secondary file-button">
                <ImagePlus size={17} />
                {photoAction.busy ? 'Procesando…' : 'Subir foto'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={photoAction.busy}
                  onChange={upload}
                />
              </label>
            </PanelTitle>
            <InlineError>{uploadError || (photoToDelete ? '' : photoAction.error)}</InlineError>

            {venue.image_url.length > 0 ? (
              <div className="gallery">
                {venue.image_url.map((url, index) => (
                  <div key={url}>
                    <img src={url} alt={venue.name + ' · foto ' + (index + 1)} loading="lazy" />
                    <Button
                      className="button--secondary icon-button"
                      aria-label={'Eliminar foto ' + (index + 1)}
                      onClick={() => confirmDelete(url)}
                    >
                      <Trash2 size={17} />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty>
                <strong>Todavía no hay fotos</strong>
                <p>Sube una imagen para mostrar el recinto.</p>
              </Empty>
            )}
          </section>

          {photoToDelete && (
            <Modal aria-label="Eliminar foto" onClose={closeConfirmation}>
              <ModalTitle>Eliminar foto</ModalTitle>
              <p>La foto dejará de aparecer en el recinto.</p>
              <InlineError>{photoAction.error}</InlineError>
              <ModalActions>
                <Button
                  className="button--danger"
                  disabled={photoAction.busy}
                  onClick={() => deletePhoto(photoToDelete)}
                >
                  Eliminar foto
                </Button>
              </ModalActions>
            </Modal>
          )}
          {editing && (
            <Modal aria-label="Editar mi recinto" onClose={() => setEditing(false)}>
              <ModalTitle>Editar mi recinto</ModalTitle>
              <form className="form-stack" onSubmit={saveComplex}>
                <CheckboxGroup
                  title="Deportes"
                  options={sportKeys.map(sport => ({
                    name: 'sport-' + sport,
                    label: SPORTS[sport],
                    checked: venue.sports.includes(sport),
                  }))}
                />
                <CheckboxGroup
                  title="Equipamiento por deporte"
                  options={sportKeys.map(sport => ({
                    name: 'equipment-' + sport,
                    label: SPORTS[sport],
                    checked: venue.equipment?.[sport],
                  }))}
                />
                <CheckboxGroup
                  title="Instalaciones"
                  options={facilityKeys.map(key => ({
                    name: 'facility-' + key,
                    label: FACILITIES[key],
                    checked: venue.facilities?.[key],
                  }))}
                />
                <InlineError>{editAction.error}</InlineError>
                <ModalActions>
                  <Button type="submit" disabled={editAction.busy}>
                    {editAction.busy ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </ModalActions>
              </form>
            </Modal>
          )}
        </>
      )}
    </div>
  )
}

function CheckboxGroup({
  title,
  options,
}: {
  title: string
  options: { name: string; label: string; checked?: boolean }[]
}) {
  return (
    <fieldset>
      <legend>{title}</legend>
      <div className="check-grid">
        {options.map(option => (
          <label key={option.name}>
            <input type="checkbox" name={option.name} defaultChecked={option.checked} />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
