/**
  * @file Common Helpers functions to provide service to the HAL components
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

var global_api = {};

/**
 * Globalize the application API, for them to be usable anywhere in helpers
 * @param {object} root is program root
 * @returns None
 */
function helper_globalize_API(root) {
  global_api['SWConfigurationAPI'] = root.SWConfigurationAPI;
  global_api['peripheralsResourceManagerAPI'] = root.peripheralsResourceManagerAPI;
  global_api['clockAPI'] = root.clockAPI;
}

/**
 * Concatenate selections to be able to generate them in 1 time
 * @param {string} pins Global pins
 * @param {string} layer Current layer prefix keyword
 * @param {string} pin Current pin to add in the global pins
 * @returns {string} Current added in the global pins.
 */
function helper_sbs_concatenate_selections(pins, layer, pin) {
  let result = "";
  let current_pin = layer + pin;
  try {
    if (pins == "") {
      result = current_pin;
    }
    else {
      result = pins + " | " + current_pin;
    }
    /* console.log(`[INFO] helper_concatenate_pins: result=${JSON.stringify(result)}`); */
  } catch (e) {
    console.error(`[ERROR] helper_concatenate_pins: ${e}`);
  }
  return result;
}

/**
 * Check if the Object button is/are selected(TRUE/ FALSE)
 * @param {string} obj Object button
 * @returns {boolean} Object button state.
 */
function helper_sbs_any_true(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  for (const key in obj) {
    if (!Object.hasOwn(obj, key)) continue;
    const value = obj[key];

    // Direct boolean property
    if (value === true) {
      return true;
    }

    // Check direct sub-object for any true property
    if (typeof value === 'object' && value !== null) {
      for (const subKey in value) {
        if (!Object.hasOwn(value, subKey)) continue;
        if (value[subKey] === true) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks the SMBUS configuration for I2C instances (I2C1, I2C3, I2C4).
 * Iterates through the configuration and determines which I2C instances are assigned as owners.
 * @returns {Object} An object with boolean values indicating the presence of each I2C instance as an owner.
 *                   Example: { I2C1: true, I2C3: false, I2C4: true }
 */
function helper_sbs_check_i2C_smbus() {
  const result = { I2C1: false, I2C3: false, I2C4: false };
  try {
    let json = '{"cgroup": "STM32CubeMX2 Config", "csub": "SMBUS"}';
    let json_obj = JSON.parse(json);
    let configuration = global_api.SWConfigurationAPI.getInstancesConfiguration(json_obj);

    for (const config of configuration) {
      /* Defensive: check the path exists */
      const owner = config?.settings?.parameters?.system?.gpio?.gpio_scl?.needs?.[0]?.owner;
      if (owner === "I2C1") result.I2C1 = true;
      if (owner === "I2C3") result.I2C3 = true;
      if (owner === "I2C4") result.I2C4 = true;
    }
    console.log(`[INFO] helper_sbs_check_i2C_smbus result:`, result);
  } catch (error) {
    console.error(`[ERROR] helper_sbs_check_i2C_smbus: ${error}`);
    return null;
  }
  return result;
}

/**
 * Check if the selected peripheral is active or not.
 * @param {string} periph peripheral object.
 * @returns {boolean} peripheral availablity state.
 */
function helper_sbs_check_peripheral(periph) {
  let result = false;
  try {
    /* Build the query object with the input periph */
    let json_obj = {
      cgroup: "STM32CubeMX2 Config",
      csub: periph
    };

    /* Get the configuration for the specific peripheral */
    let configuration = global_api.SWConfigurationAPI.getInstancesConfiguration(json_obj);

    /* Check if configuration is a non-empty array */
    if (Array.isArray(configuration) && configuration.length > 0) {
      result = true;
    }

    console.log(`[INFO] helper_sbs_check_peripheral configuration:`, configuration);
    console.log(`[INFO] helper_sbs_check_peripheral result:`, result);
  } catch (error) {
    console.error(`[ERROR] helper_sbs_check_peripheral: ${error}`);
    return null;
  }
  return result;
}

/**
  * Get security privilege items based on layer, security privilege, and access levels.
  * @param {string} layer
  * @param {string} security_privilege PRIV or SEC
  * @param {Array<string>} access_levels
  * @returns {Array<string>} The security privilege items
  */
function helper_sbs_get_security_privilege_items(
  layer,
  security_privilege,
  enable_all,
  access_levels
) {
  try {
    console.log("[INFO] helper_sbs_get_security_privilege_items:", access_levels);

    let result = "";
    if (enable_all) {
      result = layer + "_SBS_" + security_privilege + "_ITEM_ALL";
    } else {
      const map_defined_security_privilege = security_privilege === "SEC"
        ? {
        clock: layer + "_SBS_" + security_privilege + "_ITEM_CLOCK",
        classb: layer + "_SBS_" + security_privilege + "_ITEM_CLASSB",
        fpu: layer + "_SBS_" + security_privilege + "_ITEM_FPU"
      }
      : {
        clock: layer + "_SBS_" + security_privilege + "_ITEM_CLOCK",
        classb: layer + "_SBS_" + security_privilege + "_ITEM_CLASSB",
        pm: layer + "_SBS_" + security_privilege + "_ITEM_PM",
        bridge: layer + "_SBS_" + security_privilege + "_ITEM_BRIDGE"
      };

      let next_element = false;
      for (const key in access_levels) {
        if (!Object.hasOwn(access_levels, key)) continue;

        const element = access_levels[key];
        if (element === 'PRIV' && map_defined_security_privilege[key]) {
          if (next_element) {
            result += " | ";
          }
          result += map_defined_security_privilege[key];
          next_element = true;
        }
      }
    }
    return result;
  } catch (error) {
    console.error(
      `[ERROR] helper_sbs_get_security_privilege_items: ${error.message}`
    );
    return false;
  }
}

/**
  * Retrieve all the interruptions set by SBS but not generated
  * @param {object} nvic_api Getter on NVIC api
  * @param {object} exti_api Getter on EXTI api
  * @param {object} resource Current resource
  * @param {object} config current configuration of the SBS
  * @returns {object[]}
  */
function helper_sbs_get_irq_handler(nvic_api, exti_api, resource, config) {
  let result = [];
  try {
    console.log(
      `[INFO] helper_sbs_get_irq_handler: resource=${resource}, config=${JSON.stringify(config)}`
    );

    /** Check the peripheral interruptions have been generated or not */
    const enableInterruption = config?.system?.nvic?.bridge_error_interruption ?? false;
    if (enableInterruption) {

      /** Check if IRQ handler generated is done on code generation or not */
      const irqHandlerGeneration = config.system?.nvic?.irq_handler_generation ?? false;

      if (!irqHandlerGeneration) {
        const labels = config.info?.labels || [];
        const nvic_config = nvic_api.getNeedById(config.system?.nvic?.irq_line_priority?.needs[0].id);
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
    console.log(`[ERROR] helper_sbs_get_irq_handler: ${e}`);
  }
  return result;
}

module.exports = {
  helper_globalize_API,
  helper_sbs_concatenate_selections,
  helper_sbs_any_true,
  helper_sbs_check_i2C_smbus,
  helper_sbs_check_peripheral,
  helper_sbs_get_security_privilege_items,
  helper_sbs_get_irq_handler
};
