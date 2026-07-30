import { useEffect, useRef, useState } from 'react'
import { ApiClientError } from '@/services/api.client'
import { adminRepository } from '@/services/admin.repository'
import type { AdminProduct } from '@/types/commerce'
import styles from './AdminPage.module.css'

type ProductFormPanelProps = {
  accessToken: string
  product: AdminProduct | null
  onSaved: (product: AdminProduct) => void
  onCancel: () => void
}

type FormState = {
  slug: string
  name: string
  description: string
  price: string
  category: string
  careLevel: string
  lightLevel: string
  size: string
  stock: string
  petFriendly: boolean
  isFeatured: boolean
  isActive: boolean
  imageUrl: string
  imageAlt: string
  tags: string
}

const emptyForm: FormState = {
  slug: '',
  name: '',
  description: '',
  price: '',
  category: 'interior',
  careLevel: 'easy',
  lightLevel: 'medium',
  size: 'm',
  stock: '0',
  petFriendly: false,
  isFeatured: false,
  isActive: true,
  imageUrl: '',
  imageAlt: '',
  tags: '',
}

const CATEGORIES = ['suculentas', 'interior', 'florales', 'colgantes']
const CARE_LEVELS = ['easy', 'medium', 'hard']
const LIGHT_LEVELS = ['low', 'medium', 'high']
const SIZES = ['xs', 's', 'm', 'l', 'xl']

const toFormState = (product: AdminProduct): FormState => ({
  slug: product.slug,
  name: product.name,
  description: product.description,
  price: String(product.price),
  category: product.category,
  careLevel: product.careLevel,
  lightLevel: product.lightLevel,
  size: product.size,
  stock: String(product.stock),
  petFriendly: product.petFriendly,
  isFeatured: product.isFeatured,
  isActive: product.isActive,
  imageUrl: product.images[0]?.url ?? '',
  imageAlt: product.images[0]?.alt ?? '',
  tags: product.tags.join(', '),
})

export default function ProductFormPanel({
  accessToken,
  product,
  onSaved,
  onCancel,
}: ProductFormPanelProps) {
  const isEditing = product !== null
  const [form, setForm] = useState<FormState>(product ? toFormState(product) : emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setForm(product ? toFormState(product) : emptyForm)
    setError(null)
    setMessage(null)
  }, [product])

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const buildPayload = () => ({
    slug: form.slug.trim(),
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price),
    category: form.category,
    careLevel: form.careLevel,
    lightLevel: form.lightLevel,
    size: form.size,
    stock: Number(form.stock),
    petFriendly: form.petFriendly,
    isFeatured: form.isFeatured,
    isActive: form.isActive,
    images: [{ url: form.imageUrl.trim(), alt: form.imageAlt.trim() || form.name.trim() }],
    tags: form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const payload = buildPayload()
      const saved = isEditing
        ? await adminRepository.updateProduct(accessToken, product.id, payload)
        : await adminRepository.createProduct(accessToken, payload)

      setMessage(isEditing ? 'Producto actualizado.' : 'Producto creado.')
      onSaved(saved)
    } catch (incomingError) {
      setError(
        incomingError instanceof ApiClientError || incomingError instanceof Error
          ? incomingError.message
          : 'No pudimos guardar el producto.',
      )
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (file: File) => {
    if (!product) {
      return
    }

    setUploading(true)
    setError(null)
    setMessage(null)

    try {
      const updated = await adminRepository.uploadProductImage(accessToken, product.id, file)
      setMessage('Imagen subida correctamente.')
      onSaved(updated)
    } catch (incomingError) {
      setError(
        incomingError instanceof ApiClientError || incomingError instanceof Error
          ? incomingError.message
          : 'No pudimos subir la imagen.',
      )
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <form className={styles.productForm} onSubmit={handleSubmit}>
      <div className={styles.productFormHeader}>
        <h3>{isEditing ? `Editar “${product.name}”` : 'Nuevo producto'}</h3>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      <div className={styles.formGrid}>
        <label className={styles.formField}>
          <span>Slug</span>
          <input
            value={form.slug}
            onChange={(event) => update('slug', event.target.value)}
            placeholder="monstera-deliciosa"
            required
          />
        </label>

        <label className={styles.formField}>
          <span>Nombre</span>
          <input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder="Monstera Deliciosa"
            required
          />
        </label>

        <label className={`${styles.formField} ${styles.formFieldWide}`}>
          <span>Descripción</span>
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            rows={3}
            required
          />
        </label>

        <label className={styles.formField}>
          <span>Precio (€)</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(event) => update('price', event.target.value)}
            required
          />
        </label>

        <label className={styles.formField}>
          <span>Stock</span>
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(event) => update('stock', event.target.value)}
            required
          />
        </label>

        <label className={styles.formField}>
          <span>Categoría</span>
          <select
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
          >
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span>Cuidado</span>
          <select
            value={form.careLevel}
            onChange={(event) => update('careLevel', event.target.value)}
          >
            {CARE_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span>Luz</span>
          <select
            value={form.lightLevel}
            onChange={(event) => update('lightLevel', event.target.value)}
          >
            {LIGHT_LEVELS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.formField}>
          <span>Tamaño</span>
          <select value={form.size} onChange={(event) => update('size', event.target.value)}>
            {SIZES.map((option) => (
              <option key={option} value={option}>
                {option.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <label className={`${styles.formField} ${styles.formFieldWide}`}>
          <span>URL de la imagen principal</span>
          <input
            type="url"
            value={form.imageUrl}
            onChange={(event) => update('imageUrl', event.target.value)}
            placeholder="https://res.cloudinary.com/..."
            required
          />
        </label>

        <label className={`${styles.formField} ${styles.formFieldWide}`}>
          <span>Texto alternativo de la imagen</span>
          <input
            value={form.imageAlt}
            onChange={(event) => update('imageAlt', event.target.value)}
            placeholder="Monstera en maceta de barro"
          />
        </label>

        <label className={`${styles.formField} ${styles.formFieldWide}`}>
          <span>Etiquetas (separadas por comas)</span>
          <input
            value={form.tags}
            onChange={(event) => update('tags', event.target.value)}
            placeholder="tropical, interior"
          />
        </label>
      </div>

      <div className={styles.checkboxRow}>
        <label>
          <input
            type="checkbox"
            checked={form.petFriendly}
            onChange={(event) => update('petFriendly', event.target.checked)}
          />
          <span>Pet-friendly</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) => update('isFeatured', event.target.checked)}
          />
          <span>Destacado</span>
        </label>
        <label>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update('isActive', event.target.checked)}
          />
          <span>Activo</span>
        </label>
      </div>

      {isEditing ? (
        <div className={styles.uploadBlock}>
          <p className={styles.uploadLabel}>Galería ({product.images.length} imágenes)</p>
          <div className={styles.thumbRow}>
            {product.images.map((image) => (
              <img key={image.url} src={image.url} alt={image.alt} className={styles.thumb} />
            ))}
          </div>
          <label className={styles.fileField}>
            <span>Añadir imagen (JPEG, PNG o WebP · máx. 5 MB)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) {
                  void handleUpload(file)
                }
              }}
            />
          </label>
          {uploading ? <p className="muted">Subiendo imagen…</p> : null}
        </div>
      ) : (
        <p className="muted">Podrás subir imágenes a Cloudinary una vez creado el producto.</p>
      )}

      {error ? (
        <p className="state-box state-error" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="state-box state-success" role="status">
          {message}
        </p>
      ) : null}

      <button type="submit" className="btn" disabled={saving}>
        {saving ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear producto'}
      </button>
    </form>
  )
}
