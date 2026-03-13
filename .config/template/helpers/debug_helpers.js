/**
 * @file CORTEX/DEBUG Helpers functions to provide service to the HAL components
 * @license
  * @attention
  *
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
 */

/**
 * @brief Generate systick enabled faults configuration string based on fault_management object and driver level.
 *
 * @param {object} fault_management  Object with boolean properties enable_usage_fault, enable_bus_fault, etc.
 * @param {string} driverLevel      Driver level string: 'LL' or 'HAL'.
 *
 * @returns {string} Bitwise OR '|' joined string of enabled faults, or 'NONE' if all faults are disabled.
 *
 * @note
 * - Fault enabled = true means the corresponding fault enable should be set.
 * - Fault disabled = false means do not set that fault.
 * - The returned string can be used directly in C code to configure systick fault enable bits.
 */

/**
  * Retrieve all the interruptions set by CORTEX_DEBUG but not generated
  * @param {object} nvic_api Getter on NVIC api
  * @param {object} _dma_api Getter on DMA api (not used)
  * @param {object} gpio_api Getter on GPIO api
  * @param {object} exti_api Getter on EXTI api
  * @param {object} resource Current resource
  * @param {object} _config current configuration of the CORTEX_DEBUG resource (not used)
 * @returns {object}
 */
function helper_cortex_debug_get_irq_handler(nvic_api, _dma_api, gpio_api, exti_api, resource, _config) {
  let result = [];
  try {
    console.log(
      `[INFO] helper_cortex_debug_get_irq_handler: resource=${resource}}`
    );

    /** Check the EXTI interruptions have been generated or not */
    all_functions = require('./gpio_helpers.js');
    if (typeof all_functions['helper_gpio_need_get_irq_handler'] === "function") {
      result = result.concat(all_functions['helper_gpio_need_get_irq_handler'](nvic_api, gpio_api, exti_api, resource));
    }

  } catch (e) {
    console.log(`[ERROR] helper_cortex_debug_get_irq_handler: ${e}`);
  }
  return result;
}

module.exports = {
  helper_cortex_debug_get_irq_handler
};
