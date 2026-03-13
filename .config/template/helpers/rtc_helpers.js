/**
 * @file Helpers functions used for RTC SW component
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
 * Calculate the wakeup minimum period based on RTC clock frequency, wakeup divider, 
 * asynchronous predivider and synchronous predivider
 * @param {integer} rtc_clock_frequency System clock frequency in Hz
 * @param {string} divider Wakeup divider choose by the user
 * @param {integer} asynchronous_predivider Asynchronous divider set by the user
 * @param {integer} synchronous_predivider Synchronous divider set by the user
 * @returns {integer} Wakeup minimum period in second or microsecond
 */
function helper_rtc_compute_wakeup_minimum_period(
  mode,
  rtc_clock_frequency,
  divider,
  asynchronous_predivider,
  synchronous_predivider,
  bcd_seconds_increment
){
  /* Default value : 1s */
  let result = 1;
  var period = 0;

  try {
    switch (divider) {
      case "RTCCLK_DIV16":
        divider = 16;
        /* Calculate the minimum period in microsecond */
        period = (divider * 1000000) / rtc_clock_frequency;
        break;
      case "RTCCLK_DIV8":
        divider = 8;
        /* Calculate the minimum period in microsecond */
        period = (divider * 1000000) / rtc_clock_frequency;
        break;
      case "RTCCLK_DIV4":
        divider = 4;
        /* Calculate the minimum period in microsecond */
        period = (divider * 1000000) / rtc_clock_frequency;
        break;
      case "RTCCLK_DIV2":
        divider = 2;
        /* Calculate the minimum period in microsecond */
        period = (divider * 1000000) / rtc_clock_frequency;
        break;
      case "BCD_UPDATE":
      case "BCD_UPDATE_ADD_1BIT":
        if (mode === "BCD") {
          divider = (asynchronous_predivider) * (synchronous_predivider);
        }
        else {
          divider = (asynchronous_predivider) * (Math.pow(2, bcd_seconds_increment));
        }
        /* Calculate the minimum period in second */
        period = divider / rtc_clock_frequency;
        break;
      default:
        console.log("Wrong divider.");
        break;
    }

    /* Return the output frequency */
    result = parseFloat(period.toFixed(3));
  } catch (e) {
    console.log(`[ERROR] helper_rtc_compute_wakeup_minimum_period: ${e}`);
  }
  return result;
}

/**
  * Retrieve all the interruptions set by RTC but not generated
  * @param {object} nvic_api Getter on NVIC api
  * @param {object} exti_api Getter on EXTI api (may not used)
  * @param {object} resource Current resource
  * @param {object} config current configuration of the RTC
  * @returns {object}
  */
function helper_rtc_get_irq_handler(nvic_api, exti_api, resource, config) {
  let result = [];
  try {
    // console.info(//   `helper_rtc_get_irq_handler: resource= ${resource}, config=${JSON.stringify(config)}`
    // );
    /** Reference all the elements which enable the RTC interruptions
     * @type {Array} List of interruptions available for the RTC
     * @property {string} enable Name of the property which enables the interruption
     * @property {string} irq_handler_generation Name of the property which indicates if IRQ handler generation is done or not
     * @property {string} nvic_context Name of the property which contains the NVIC context
     * @property {string} selector Suffix to be added to the alias name (empty if global interrupt, starts with underscore with NVIC selector if not empty)
     */
    const list_interrupts = [
      { enable: "enable_interruption", irq_handler_generation: "irq_handler_generation", nvic_context: "irq_line_priority", selector: "" },
    ];

    /** Parse the list of interruptions */
    for (let index = 0; index < list_interrupts.length; index++) {
      const element = list_interrupts[index];
      /** Check if interruption has been enabled on the RTC */
      const enableInterruption = config?.system?.nvic?.[element['enable']] ?? false;
      if (!enableInterruption) continue;

      /** Check if IRQ handler generated is done on code generation or not */
      const irqHandlerGeneration = config.system?.nvic?.[element['irq_handler_generation']] ?? false;

      if (!irqHandlerGeneration) {
        const labels = config.info?.labels || [];
        const nvic_config = nvic_api.getNeedById(config.system?.nvic?.[element['nvic_context']].needs[0].id);
        /** Fill the object to be used for aliases in mx_hal_def.h */
        if (labels.length) {
          let first_label = true;
          for (const label of labels) {
            result.push({
              resource,
              labels,
              first_label,
              alias: label.toUpperCase() + element['selector'],
              nvic_config,
              generated: false
            });
            first_label = false;
          }
        } else {
          result.push({
            resource,
            alias: "",
            nvic_config,
            generated: false
          });
        }
      }
    }
  } catch (e) {
    console.error(`helper_rtc_get_irq_handler: ${e}`);
  }
  return result;
}

module.exports = {
  helper_rtc_compute_wakeup_minimum_period,
  helper_rtc_get_irq_handler
};
