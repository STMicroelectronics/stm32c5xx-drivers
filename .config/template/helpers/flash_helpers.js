/**
 * @file Helpers functions used for FLASH SW component
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

/* Private constants -----------------------------------------------------------------------------------------------*/
/* Private variables -----------------------------------------------------------------------------------------------*/
/* Private function ------------------------------------------------------------------------------------------------*/
/* Exported functions ----------------------------------------------------------------------------------------------*/

/**
  * @brief Retrieve all the interruptions set by FLASH but not generated
  * @param {object} nvic_api Getter on NVIC api
  * @param {object} resource Current resource
  * @param {object} config current configuration of the FLASH
  * @returns {object} List of interruptions not generated
 */
function helper_flash_get_irq_handler(nvic_api, exti_api, resource, config) {
  let result = [];
  try {
    console.info(`helper_flash_get_irq_handler: resource= ${resource}, config=${JSON.stringify(config)}`
    );

    /** Reference all the elements which enable the FLASH interruptions */
    const list_interrupts = [
      { enable: "enable_interruption", irq_handler_generation: "irq_handler_generation", nvic_context: "irq_config1" }
    ];

    /** Parse the list of interruptions */
    for (let index = 0; index < list_interrupts.length; index++) {
      const element = list_interrupts[index];
      /** Check if interruption has beenn enabled on the FLASH */
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
              alias: label.toUpperCase(),
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
    console.error(`helper_flash_get_irq_handler: ${e}`);
  }
  return result;
}

/**
  * @brief Return the list of unitary IRQHandler APIs
  * @param {object} nvic       The nvic configuration object
  * @param {object} additional The additional configuration object
  * @returns {Array} list of unitary IRQHandler APIs
  */
function helper_flash_get_unitary_irq_handler(additional, nvic) {
  try {
    console.info(`helper_flash_get_unitary_irq_handler: additional= ${JSON.stringify(additional)}, nvic=${JSON.stringify(nvic)}`);

    let list_unitary_apis = [
      { name: "HAL_FLASH_ProgramByAddr_IRQHandler" },
      { name: "HAL_FLASH_EraseByAddr_IRQHandler" },
      { name: "HAL_FLASH_ErasePage_IRQHandler" },
      { name: "HAL_FLASH_EraseBank_IRQHandler" },
      { name: "HAL_FLASH_MassErase_IRQHandler" }
    ];

    // Conditionally add HAL_FLASH_ECC_IRQHandler
    if (Boolean(additional.enable_single_ecc_interrupt)) {
      list_unitary_apis.push({ name: "HAL_FLASH_ECC_IRQHandler" });
    }

    // Conditionally add HAL_FLASH_ITF_IRQHandler
    if (Boolean(nvic.itf_irq_handler_generation)) {
      list_unitary_apis.push({ name: "HAL_FLASH_ITF_IRQHandler" });
    }

    console.info(`helper_flash_get_unitary_irq_handler: ${JSON.stringify(list_unitary_apis)}`);

    return list_unitary_apis;
  } catch (e) {
    console.error(`helper_flash_get_unitary_irq_handler: ${e}`);
  }
}

/**
  * @brief Check if a unitary IRQ handler is enabled.
  * @param {object} nvic       The nvic configuration object
  * @param {object} additional The additional configuration object
  * @param {object} unitary_apis The unitary IRQ handler API object
  * @returns {boolean} Returns true if the IRQ handler should be enabled
 */
function helper_flash_check_unitary_irq_handler(additional, nvic, unitary_apis) {
  try {
    console.info(`helper_flash_check_unitary_irq_handler: additional= ${JSON.stringify(additional)}, nvic=${JSON.stringify(nvic)}, unitary_apis=${JSON.stringify(unitary_apis)}`);
    const { _foreignKey } = unitary_apis;

    return (
      (_foreignKey === "HAL_FLASH_ECC_IRQHandler" && additional.enable_single_ecc_interrupt) ||
      (_foreignKey === "HAL_FLASH_ITF_IRQHandler" && nvic.itf_irq_handler_generation)
    );
  } catch (e) {
    console.error(`helper_flash_check_unitary_irq_handler: ${e}`);
    return false;
  }
}

module.exports = {
  helper_flash_get_irq_handler,
  helper_flash_get_unitary_irq_handler,
  helper_flash_check_unitary_irq_handler
};