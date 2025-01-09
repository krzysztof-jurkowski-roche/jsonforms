<template>
  <control-wrapper v-bind="controlWrapper" :styles="styles" :is-focused="isFocused" :applied-options="appliedOptions">
    <!-- <textarea name="debug" id="debug" :value="JSON.stringify(control, null, 2)"></textarea> -->
    <q-input :id="control.id + '-input'" type="number" :step="step" :class="styles.control.input"
      :model-value="control.data" :disabled="!control.enabled" :autofocus="appliedOptions.focus"
      :hint="appliedOptions.placeholder" @change="onChange" @focus="isFocused = true" @blur="isFocused = false"
      :error="control.errors.length > 0" />
    <!-- :error-message="control.errors"  -->
  </control-wrapper>
</template>

<script lang="ts">
import {
  isNumberControl,
  rankWith,
  type ControlElement,
  type JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { defineComponent } from 'vue';
import {
  rendererProps,
  useJsonFormsControl,
  type RendererProps,
} from '../../config/jsonforms';
import { useQuasarControl, useVanillaControl } from '../util';
import { default as ControlWrapper } from './ControlWrapper.vue';

const controlRenderer = defineComponent({
  name: 'NumberControlRenderer',
  components: {
    ControlWrapper,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },
  // setup(props: RendererProps<ControlElement>) {
  //   return useVanillaControl(useJsonFormsControl(props), (target) =>
  //     target.value === '' ? undefined : Number(target.value)
  //   );
  // },
  setup(props: RendererProps<ControlElement>) {
    const adaptValue = (value: any) => {
      return value == null ? undefined : Number(value)
    };
    const input = useQuasarControl(useJsonFormsControl(props), adaptValue);

    return { ...input, adaptValue };
  },
  computed: {
    step(): number {
      const options: any = this.appliedOptions;
      return options.step ?? 0.1;
    },
  },
});

export default controlRenderer;

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: controlRenderer,
  tester: rankWith(1, isNumberControl),
};
</script>
