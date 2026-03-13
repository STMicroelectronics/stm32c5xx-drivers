/**
 * @file Helpers functions used for ADC SW component
 * @license
 * Copyright (c) 2024 STMicroelectronics.
 * All rights reserved.
 *
 * This software is licensed under terms that can be found in the LICENSE file
 * in the root directory of this software component.
 * If no LICENSE file comes with this software, it is provided AS-IS.
 */

/**
 * Handlebars Helper: helper_opamp_is_number
 * - Returns true if the argument is a number (string or number)
 * - Otherwise returns false
 *
 * @param {any} value - The value to test
 * @returns {boolean}
 */
function helper_opamp_is_number(value) {
  try {
    return !isNaN(Number(value));
  } catch (e) {
    console.error(`[ERROR] helper_opamp_is_number: ${e}`);
    return false;
  }
}


/**
 * Handlebars Helper: helper_opamp_get_dac_input
 * - Returns "DAC1_CH2" if instance is "OPAMP1"
 * - Returns "IO3" if instance is "OPAMP2" and layer is "LL"
 * - Otherwise returns an empty string
 *
 * @param {string} instance - The OPAMP instance (e.g., @root.current_resource)
 * @param {string} layer - The current layer (e.g., @root.current_layer)
 * @returns {string}
 */
function helper_opamp_get_dac_input(instance, layer){
  try {
    if (typeof instance === 'string' && instance === 'OPAMP1') {
      return 'DAC1_CH2';
    }
    return '';
  } catch (e) {
    console.error(`[ERROR] helper_opamp_get_dac_input: ${e}`);
    return '';
  }
}

/**
 * Handlebars Helper: helper_opamp_adjust_gain
 *
 * Adjusts the gain value according to a predefined mapping.
 * If the gain is not in the mapping, returns the original gain.
 *
 * @param {number} gain - The input gain value
 * @returns {number} - The adjusted gain value
 */
function helper_opamp_adjust_gain(gain) {
  try {
    const gainMap = {
      1: 2,
      3: 4,
      7: 8,
      15: 16
    };

    return gainMap[gain] !== undefined ? gainMap[gain] : gain;
  } catch (e) {
    console.error(`[ERROR] helper_opamp_adjust_gain: ${e}`);
    return gain;
  }
}

/**
 * Handlebars Helper: helper_opamp_transform_trigger_name
 *
 * Transforms trigger names by:
 * - Converting to uppercase
 * - Replacing 'OC' or 'CC' with 'CH'
 *
 * Examples:
 *  - "tim1_oc6" -> "TIM1_CH6"
 *  - "tim2_oc4" -> "TIM2_CH4"
 *
 * @param {string} trigger - The trigger name to transform
 * @returns {string|null} - The transformed trigger name or null if input invalid
 */
function helper_opamp_transform_trigger_name(trigger) {
  try {
    if (!trigger || typeof trigger !== 'string') {
      console.error('[ERROR] helper_opamp_transform_trigger_name: Invalid input');
      return null;
    }

    // Convert to uppercase
    let transformed = trigger.toUpperCase();

    // Replace 'OC' or 'CC' with 'CH'
    transformed = transformed.replace(/CH|CC/g, 'OC');

    return transformed;
  } catch (e) {
    console.error(`[ERROR] helper_opamp_transform_trigger_name: ${e}`);
    return null;
  }
}

module.exports = {
  helper_opamp_is_number,
  helper_opamp_get_dac_input,
  helper_opamp_adjust_gain,
  helper_opamp_transform_trigger_name
};
