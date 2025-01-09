import {
  composePaths,
  computeLabel,
  findUISchema,
  getFirstPrimitiveProp,
  isDescriptionHidden,
  Resolve,
  type ControlElement,
  type DispatchPropsOfControl,
  type DispatchPropsOfMultiEnumControl,
  type UISchemaElement,
} from '@jsonforms/core';
import { debounce, get, isPlainObject } from 'lodash';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import { computed, ref, type ComputedRef } from 'vue';
import { useStyles } from '../styles';

/**
 * Adds styles, isFocused, appliedOptions and onChange
 */
export const useVanillaControl = <
  I extends { control: any; handleChange: any }
>(
  input: I,
  adaptTarget: (target: any) => any = (v) => v.value
) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    )
  );

  const isFocused = ref(false);
  const onChange = (event: Event) => {
    input.handleChange(input.control.value.path, adaptTarget(event.target));
  };

  const controlWrapper = computed(() => {
    const { id, description, errors, label, visible, required } =
      input.control.value;
    return { id, description, errors, label, visible, required };
  });

  return {
    ...input,
    styles: useStyles(input.control.value.uischema),
    isFocused,
    appliedOptions,
    controlWrapper,
    onChange,
  };
};

/**
 * Adds styles and appliedOptions
 */
export const useVanillaLayout = <I extends { layout: any }>(input: I) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.layout.value.config),
      cloneDeep(input.layout.value.uischema.options)
    )
  );
  return {
    ...input,
    styles: useStyles(input.layout.value.uischema),
    appliedOptions,
  };
};

/**
 * Adds styles and appliedOptions
 */
export const useVanillaLabel = <I extends { label: any }>(input: I) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.label.value.config),
      cloneDeep(input.label.value.uischema.options)
    )
  );
  return {
    ...input,
    styles: useStyles(input.label.value.uischema),
    appliedOptions,
  };
};

/**
 * Adds styles, appliedOptions and childUiSchema
 */
export const useVanillaArrayControl = <I extends { control: any }>(
  input: I
) => {
  const appliedOptions = computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    )
  );

  const childUiSchema = computed(() =>
    findUISchema(
      input.control.value.uischemas,
      input.control.value.schema,
      input.control.value.uischema.scope,
      input.control.value.path,
      undefined,
      input.control.value.uischema,
      input.control.value.rootSchema
    )
  );

  const childLabelForIndex = (index: number) => {
    const childLabelProp =
      input.control.value.uischema.options?.childLabelProp ??
      getFirstPrimitiveProp(input.control.value.schema);
    if (!childLabelProp) {
      return `${index}`;
    }
    const labelValue = Resolve.data(
      input.control.value.data,
      composePaths(`${index}`, childLabelProp)
    );
    if (
      labelValue === undefined ||
      labelValue === null ||
      Number.isNaN(labelValue)
    ) {
      return '';
    }
    return `${labelValue}`;
  };
  return {
    ...input,
    styles: useStyles(input.control.value.uischema),
    appliedOptions,
    childUiSchema,
    childLabelForIndex,
  };
};

export const useControlAppliedOptions = <
  T extends { config: any; uischema: UISchemaElement },
  I extends {
    control: ComputedRef<T>;
  },
>(
  input: I,
) => {
  return computed(() =>
    merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options),
    ),
  );
};

export const useComputedLabel = <
  T extends { label: string; required: boolean },
  I extends { control: ComputedRef<T> },
>(
  input: I,
  appliedOptions: ReturnType<typeof useControlAppliedOptions>,
) => {
  return computed((): string => {
    return computeLabel(
      input.control.value.label,
      input.control.value.required,
      !!appliedOptions.value?.hideRequiredAsterisk,
    );
  });
};

/**
 * Adds styles, isFocused, appliedOptions and onChange
 */
export const useQuasarControl = <
  T extends {
    uischema: ControlElement;
    path: string;
    config: any;
    label: string;
    description: string;
    required: boolean;
    errors: string;
    id: string;
    visible: boolean;
  },
  I extends {
    control: ComputedRef<T>;
  } & (DispatchPropsOfControl | DispatchPropsOfMultiEnumControl),
>(
  input: I,
  adaptValue: (target: any) => any = (v) => v,
  debounceWait?: number,
) => {
  const touched = ref(false);

  const changeEmitter =
    typeof debounceWait === 'number' &&
      (input as DispatchPropsOfControl).handleChange
      ? debounce((input as DispatchPropsOfControl).handleChange, debounceWait)
      : (input as DispatchPropsOfControl).handleChange;

  const onChange = (value: any) => {
    if (changeEmitter) {
      changeEmitter(input.control.value.path, adaptValue(value));
    }
  };

  const appliedOptions = useControlAppliedOptions(input);
  const isFocused = ref(false);

  const handleFocus = () => {
    isFocused.value = true;
  };

  const handleBlur = () => {
    touched.value = true;
    isFocused.value = false;
  };

  const filteredErrors = computed(() => {
    return touched.value || !appliedOptions.value.enableFilterErrorsBeforeTouch
      ? input.control.value.errors
      : '';
  });

  const persistentHint = (): boolean => {
    return !isDescriptionHidden(
      input.control.value.visible,
      input.control.value.description,
      isFocused.value,
      !!appliedOptions.value?.showUnfocusedDescription,
    );
  };

  const computedLabel = useComputedLabel(input, appliedOptions);

  const controlWrapper = computed(() => {
    const { id, description, errors, label, visible, required } =
      input.control.value;
    return { id, description, errors, label, visible, required };
  });

  const styles = useStyles(input.control.value.uischema);

  //TODO: what are these
  const quasarProps = (path: string) => {
    const props = get(appliedOptions.value?.quasar, path);

    return props && isPlainObject(props) ? props : {};
  };

  const overwrittenControl = computed(() => {
    return {
      ...input.control.value,
      errors: filteredErrors.value,
    };
  });

  const rawErrors = computed(() => input.control.value.errors);

  return {
    ...input,
    control: overwrittenControl,
    styles,
    isFocused,
    appliedOptions,
    controlWrapper,
    onChange,
    quasarProps,
    persistentHint,
    computedLabel,
    touched,
    handleBlur,
    handleFocus,
    rawErrors,
  };
};

