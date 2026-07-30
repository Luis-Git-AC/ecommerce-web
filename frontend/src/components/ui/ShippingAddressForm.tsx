import type { ShippingAddress } from '@/types/commerce'
import type { ShippingAddressErrors } from '@/utils/shipping'
import styles from './ShippingAddressForm.module.css'

type ShippingAddressFormProps = {
  value: ShippingAddress
  errors: ShippingAddressErrors
  disabled?: boolean
  onChange: (next: ShippingAddress) => void
}

type FieldConfig = {
  name: keyof ShippingAddress
  label: string
  placeholder: string
  autoComplete: string
  inputMode?: 'text' | 'numeric' | 'tel'
  optional?: boolean
  wide?: boolean
}

const FIELDS: FieldConfig[] = [
  {
    name: 'fullName',
    label: 'Nombre y apellidos',
    placeholder: 'Lucía Fernández',
    autoComplete: 'name',
    wide: true,
  },
  {
    name: 'line1',
    label: 'Dirección',
    placeholder: 'Calle Mayor 12, 3.º B',
    autoComplete: 'address-line1',
    wide: true,
  },
  {
    name: 'line2',
    label: 'Detalles adicionales',
    placeholder: 'Portal, escalera, referencia…',
    autoComplete: 'address-line2',
    optional: true,
    wide: true,
  },
  {
    name: 'postalCode',
    label: 'Código postal',
    placeholder: '28013',
    autoComplete: 'postal-code',
    inputMode: 'numeric',
  },
  { name: 'city', label: 'Ciudad', placeholder: 'Madrid', autoComplete: 'address-level2' },
  { name: 'province', label: 'Provincia', placeholder: 'Madrid', autoComplete: 'address-level1' },
  {
    name: 'phone',
    label: 'Teléfono',
    placeholder: '+34 600 123 456',
    autoComplete: 'tel',
    inputMode: 'tel',
  },
]

export default function ShippingAddressForm({
  value,
  errors,
  disabled = false,
  onChange,
}: ShippingAddressFormProps) {
  const update = (field: keyof ShippingAddress, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue })
  }

  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>Dirección de envío</legend>
      <div className={styles.grid}>
        {FIELDS.map((field) => {
          const error = errors[field.name]
          const inputId = `shipping-${field.name}`

          return (
            <div
              key={field.name}
              className={`${styles.field} ${field.wide ? styles.fieldWide : ''}`}
            >
              <label htmlFor={inputId}>
                {field.label}
                {field.optional ? <span className={styles.optional}> (opcional)</span> : null}
              </label>
              <input
                id={inputId}
                name={field.name}
                type="text"
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                placeholder={field.placeholder}
                value={value[field.name] ?? ''}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${inputId}-error` : undefined}
                onChange={(event) => update(field.name, event.target.value)}
              />
              {error ? (
                <p id={`${inputId}-error`} className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
