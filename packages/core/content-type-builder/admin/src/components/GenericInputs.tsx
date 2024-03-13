/**
 * TODO: we should be using the FormRenderer from the admin to do this,
 * but the CTB has no tests or types, so we can't refactor it safely.
 * So we're just adding this to the tech debt.
 */

import * as React from 'react';

import {
  Checkbox,
  DatePicker,
  DateTimePicker,
  Icon,
  JSONInput,
  NumberInput,
  SingleSelect,
  SingleSelectOption,
  Textarea,
  TextInput,
  TimePicker,
  ToggleInput,
} from '@strapi/design-system';
import { Eye, EyeStriked } from '@strapi/icons';
import formatISO from 'date-fns/formatISO';
import isEqual from 'lodash/isEqual';
import { type MessageDescriptor, type PrimitiveType, useIntl } from 'react-intl';

import type { Attribute } from '@strapi/types';

interface TranslationMessage extends MessageDescriptor {
  values?: Record<string, PrimitiveType>;
}

interface InputOption {
  metadatas: {
    intlLabel: TranslationMessage;
    disabled: boolean;
    hidden: boolean;
  };
  key: string;
  value: string;
}

interface CustomInputProps<TAttribute extends Attribute.Any>
  extends Omit<GenericInputProps<TAttribute>, 'customInputs'> {
  ref?: React.Ref<HTMLElement>;
  hint?: string | React.JSX.Element | (string | React.JSX.Element)[];
}
const pxToRem = (px: number) => `${px / 16}rem`;

interface GenericInputProps<TAttribute extends Attribute.Any = Attribute.Any> {
  attribute?: TAttribute;
  autoComplete?: string;
  customInputs?: Record<string, React.ComponentType<CustomInputProps<TAttribute>>>;
  description?: TranslationMessage;
  disabled?: boolean;
  error?: string | TranslationMessage;
  intlLabel: TranslationMessage;
  labelAction?: React.ReactNode;
  name: string;
  onChange: (
    payload: {
      target: {
        name: string;
        value: Attribute.GetValue<TAttribute>;
        type?: string;
      };
    },
    shouldSetInitialValue?: boolean
  ) => void;
  options?: InputOption[];
  placeholder?: TranslationMessage;
  required?: boolean;
  step?: number;
  type: string;
  // TODO: The value depends on the input type, too complicated to handle all cases here
  value?: Attribute.GetValue<TAttribute>;
  isNullable?: boolean;
}

const GenericInput = ({
  autoComplete,
  customInputs,
  description,
  disabled,
  intlLabel,
  labelAction,
  error,
  name,
  onChange,
  options = [],
  placeholder,
  required,
  step,
  type,
  value: defaultValue,
  isNullable,
  attribute,
  ...rest
}: GenericInputProps) => {
  const { formatMessage } = useIntl();

  // TODO: Workaround to get the field hint values if they exist on the type
  const getFieldHintValue = (attribute?: Attribute.Any, key?: keyof FieldSchema) => {
    if (!attribute) return;

    if (key === 'minLength' && key in attribute) {
      return attribute[key];
    }

    if (key === 'maxLength' && key in attribute) {
      return attribute[key];
    }

    if (key === 'max' && key in attribute) {
      return attribute[key];
    }

    if (key === 'min' && key in attribute) {
      return attribute[key];
    }
  };

  const { hint } = useFieldHint({
    description,
    fieldSchema: {
      minLength: getFieldHintValue(attribute, 'minLength'),
      maxLength: getFieldHintValue(attribute, 'maxLength'),
      max: getFieldHintValue(attribute, 'max'),
      min: getFieldHintValue(attribute, 'min'),
    },
    type: attribute?.type || type,
  });

  const [showPassword, setShowPassword] = React.useState(false);

  const CustomInput = customInputs ? customInputs[type] : null;

  // the API always returns null, which throws an error in React,
  // therefore we cast this case to undefined
  const value = defaultValue ?? undefined;

  /*
   TODO: ideally we should pass in `defaultValue` and `value` for
   inputs, in order to make them controlled components. This variable
   acts as a fallback for now, to prevent React errors in devopment mode

   See: https://github.com/strapi/strapi/pull/12861
  */
  const valueWithEmptyStringFallback = value ?? '';

  function getErrorMessage(error: string | TranslationMessage | undefined) {
    if (!error) {
      return null;
    }

    if (typeof error === 'string') {
      return formatMessage({ id: error, defaultMessage: error });
    }

    const values = {
      ...error.values,
    };

    return formatMessage(
      {
        id: error.id,
        defaultMessage: error?.defaultMessage ?? error.id,
      },
      values
    );
  }

  const errorMessage = getErrorMessage(error) ?? undefined;

  if (CustomInput) {
    return (
      <CustomInput
        {...rest}
        attribute={attribute}
        description={description}
        hint={hint}
        disabled={disabled}
        intlLabel={intlLabel}
        labelAction={labelAction}
        error={errorMessage || ''}
        name={name}
        onChange={onChange}
        options={options}
        required={required}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    );
  }

  const label = intlLabel.id
    ? formatMessage(
        { id: intlLabel.id, defaultMessage: intlLabel.defaultMessage },
        { ...intlLabel.values }
      )
    : name;

  const formattedPlaceholder = placeholder
    ? formatMessage(
        { id: placeholder.id, defaultMessage: placeholder.defaultMessage },
        { ...placeholder.values }
      )
    : '';

  switch (type) {
    case 'json': {
      return (
        <JSONInput
          label={label}
          labelAction={labelAction}
          value={value}
          error={errorMessage}
          disabled={disabled}
          hint={hint}
          required={required}
          onChange={(json) => {
            // Default to null when the field is not required and there is no input value
            const value =
              attribute && 'required' in attribute && !attribute?.required && !json.length
                ? null
                : json;
            onChange({ target: { name, value } }, false);
          }}
          minHeight={pxToRem(252)}
          maxHeight={pxToRem(504)}
        />
      );
    }
    case 'bool': {
      return (
        <ToggleInput
          checked={defaultValue === null ? null : defaultValue || false}
          disabled={disabled}
          hint={hint}
          label={label}
          error={errorMessage}
          labelAction={labelAction}
          name={name}
          offLabel={formatMessage({
            id: 'app.components.ToggleCheckbox.off-label',
            defaultMessage: 'False',
          })}
          onLabel={formatMessage({
            id: 'app.components.ToggleCheckbox.on-label',
            defaultMessage: 'True',
          })}
          onChange={(e) => {
            onChange({ target: { name, value: e.target.checked } });
          }}
          required={required}
          onClear={() => {
            onChange({ target: { name, value: null } });
          }}
          clearLabel={
            isNullable
              ? formatMessage({
                  id: 'app.components.ToggleCheckbox.clear-label',
                  defaultMessage: 'Clear',
                })
              : undefined
          }
        />
      );
    }
    case 'checkbox': {
      return (
        <Checkbox
          disabled={disabled}
          error={errorMessage}
          hint={hint}
          id={name}
          name={name}
          onValueChange={(value) => {
            onChange({ target: { name, value } });
          }}
          required={required}
          value={Boolean(value)}
        >
          {label}
        </Checkbox>
      );
    }
    case 'datetime': {
      return (
        <DateTimePicker
          clearLabel={formatMessage({ id: 'clearLabel', defaultMessage: 'Clear' })}
          disabled={disabled}
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onChange={(date) => {
            // check if date is not null or undefined
            const formattedDate = date ? date.toISOString() : null;

            onChange({ target: { name, value: formattedDate, type } });
          }}
          onClear={() => onChange({ target: { name, value: null, type } })}
          placeholder={formattedPlaceholder}
          required={required}
          value={value}
        />
      );
    }
    case 'date': {
      return (
        <DatePicker
          clearLabel={formatMessage({ id: 'clearLabel', defaultMessage: 'Clear' })}
          disabled={disabled}
          error={errorMessage}
          label={label}
          id={name}
          hint={hint}
          name={name}
          onChange={(date) => {
            onChange({
              target: {
                name,
                value: date ? formatISO(date, { representation: 'date' }) : null,
                type,
              },
            });
          }}
          onClear={() => onChange({ target: { name, value: null, type } })}
          placeholder={formattedPlaceholder}
          required={required}
          selectedDate={value}
        />
      );
    }
    case 'number': {
      return (
        <NumberInput
          disabled={disabled}
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onValueChange={(value) => {
            onChange({ target: { name, value, type } });
          }}
          placeholder={formattedPlaceholder}
          required={required}
          step={step}
          value={value}
        />
      );
    }
    case 'email': {
      return (
        <TextInput
          autoComplete={autoComplete}
          disabled={disabled}
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onChange={(e) => {
            onChange({ target: { name, value: e.target.value, type } });
          }}
          placeholder={formattedPlaceholder}
          required={required}
          type="email"
          value={valueWithEmptyStringFallback}
        />
      );
    }
    case 'timestamp':
    case 'text':
    case 'string': {
      return (
        <TextInput
          autoComplete={autoComplete}
          disabled={disabled}
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onChange={(e) => {
            onChange({ target: { name, value: e.target.value, type } });
          }}
          placeholder={formattedPlaceholder}
          required={required}
          type="text"
          value={valueWithEmptyStringFallback}
        />
      );
    }
    case 'password': {
      return (
        <TextInput
          autoComplete={autoComplete}
          disabled={disabled}
          error={errorMessage}
          endAction={
            <button
              aria-label={formatMessage({
                id: 'Auth.form.password.show-password',
                defaultMessage: 'Show password',
              })}
              onClick={() => {
                setShowPassword((prev) => !prev);
              }}
              style={{
                border: 'none',
                padding: 0,
                background: 'transparent',
              }}
              type="button"
            >
              {showPassword ? (
                <Icon as={Eye} color="neutral500" />
              ) : (
                <Icon as={EyeStriked} color="neutral500" />
              )}
            </button>
          }
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onChange={(e) => {
            onChange({ target: { name, value: e.target.value, type } });
          }}
          placeholder={formattedPlaceholder}
          required={required}
          type={showPassword ? 'text' : 'password'}
          value={valueWithEmptyStringFallback}
        />
      );
    }
    case 'select': {
      return (
        <SingleSelect
          disabled={disabled}
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onChange={(value) => {
            onChange({ target: { name, value, type: 'select' } });
          }}
          placeholder={formattedPlaceholder}
          required={required}
          value={value}
        >
          {options.map(({ metadatas: { intlLabel, disabled, hidden }, key, value }) => {
            return (
              <SingleSelectOption key={key} value={value} disabled={disabled} hidden={hidden}>
                {formatMessage(intlLabel)}
              </SingleSelectOption>
            );
          })}
        </SingleSelect>
      );
    }
    case 'textarea': {
      return (
        <Textarea
          disabled={disabled}
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onChange={(event) => onChange({ target: { name, value: event.target.value, type } })}
          required={required}
          placeholder={formattedPlaceholder}
          value={valueWithEmptyStringFallback}
        />
      );
    }
    case 'time': {
      let time = value;

      // The backend send a value which has the following format: '00:45:00.000'
      // or the time picker only supports hours & minutes so we need to mutate the value
      if (typeof value === 'string' && value.split(':').length > 2) {
        const [hour, minute] = value.split(':');
        time = `${hour}:${minute}`;
      }

      return (
        <TimePicker
          clearLabel={formatMessage({ id: 'clearLabel', defaultMessage: 'Clear' })}
          disabled={disabled}
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          onChange={(time) => {
            onChange({ target: { name, value: `${time}`, type } });
          }}
          onClear={() => {
            onChange({ target: { name, value: null, type } });
          }}
          required={required}
          value={time}
        />
      );
    }
    default: {
      /**
       * If there's no component for the given type, we return a disabled text input
       * showing a "Not supported" title to illustrate the issue.
       */
      return (
        <TextInput
          disabled
          error={errorMessage}
          label={label}
          labelAction={labelAction}
          id={name}
          hint={hint}
          name={name}
          placeholder="Not supported"
          required={required}
          type="text"
          value=""
        />
      );
    }
  }
};

type FieldSchema = {
  minLength?: number | string;
  maxLength?: number | string;
  max?: number | string;
  min?: number | string;
};
interface UseFieldHintProps {
  description?: MessageDescriptor & { values?: Record<string, PrimitiveType> };
  fieldSchema?: FieldSchema;
  type?: string;
}

/**
 * @description
 * A hook for generating the hint for a field
 */
const useFieldHint = ({ description, fieldSchema, type }: UseFieldHintProps) => {
  const { formatMessage } = useIntl();

  const buildDescription = () =>
    description?.id
      ? formatMessage(
          { id: description.id, defaultMessage: description.defaultMessage },
          { ...description.values }
        )
      : '';

  const buildHint = () => {
    const { maximum, minimum } = getMinMax(fieldSchema);
    const units = getFieldUnits({
      type,
      minimum,
      maximum,
    });

    const minIsNumber = typeof minimum === 'number';
    const maxIsNumber = typeof maximum === 'number';
    const hasMinAndMax = maxIsNumber && minIsNumber;
    const hasMinOrMax = maxIsNumber || minIsNumber;

    if (!description?.id && !hasMinOrMax) {
      return '';
    }

    return formatMessage(
      {
        id: 'content-manager.form.Input.hint.text',
        defaultMessage:
          '{min, select, undefined {} other {min. {min}}}{divider}{max, select, undefined {} other {max. {max}}}{unit}{br}{description}',
      },
      {
        min: minimum,
        max: maximum,
        description: buildDescription(),
        unit: units?.message && hasMinOrMax ? formatMessage(units.message, units.values) : null,
        divider: hasMinAndMax
          ? formatMessage({
              id: 'content-manager.form.Input.hint.minMaxDivider',
              defaultMessage: ' / ',
            })
          : null,
        br: hasMinOrMax ? <br /> : null,
      }
    );
  };

  return { hint: buildHint() };
};

const getFieldUnits = ({
  type,
  minimum,
  maximum,
}: {
  type?: string;
  minimum?: number;
  maximum?: number;
}) => {
  if (type && ['biginteger', 'integer', 'number'].includes(type)) {
    return {};
  }
  const maxValue = Math.max(minimum || 0, maximum || 0);

  return {
    message: {
      id: 'content-manager.form.Input.hint.character.unit',
      defaultMessage: '{maxValue, plural, one { character} other { characters}}',
    },
    values: {
      maxValue,
    },
  };
};

const getMinMax = (fieldSchema?: FieldSchema) => {
  if (!fieldSchema) {
    return { maximum: undefined, minimum: undefined };
  }

  const { minLength, maxLength, max, min } = fieldSchema;

  let minimum;
  let maximum;

  const parsedMin = Number(min);
  const parsedMinLength = Number(minLength);

  if (!Number.isNaN(parsedMin)) {
    minimum = parsedMin;
  } else if (!Number.isNaN(parsedMinLength)) {
    minimum = parsedMinLength;
  }

  const parsedMax = Number(max);
  const parsedMaxLength = Number(maxLength);

  if (!Number.isNaN(parsedMax)) {
    maximum = parsedMax;
  } else if (!Number.isNaN(parsedMaxLength)) {
    maximum = parsedMaxLength;
  }

  return { maximum, minimum };
};

/**
 * we've memoized this component because we use a context to store all the data in our form in the content-manager.
 * This then causes _every_ component to re-render because there are no selects incurring performance issues
 * in content-types as the content-type gets more complicated.
 */
const MemoizedGenericInput = React.memo(GenericInput, isEqual);

export type { GenericInputProps, CustomInputProps };
export { MemoizedGenericInput as GenericInput };