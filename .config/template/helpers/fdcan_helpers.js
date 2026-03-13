/**
  * @file Helpers functions used for FDCAN SW component
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

/* Internal cache for memoization of bit timing calculations */
const fdcan_bit_timing_cache = {};

/**
 * Calculate Time Quantum
 * @param   {number} input_clock FDCAN input clock
 * @param   {number} prescaler FDCAN prescaler
 * @param   {number} clock_divider FDCAN Clock Divider
 * @returns {number} time_quantum Time Quantum
 */
function helper_fdcan_calculate_time_quantum(input_clock, prescaler, clock_divider) {
  let time_quantum;
  try {
    console.info(`helper_fdcan_calculate_time_quantum: input_clock=${input_clock}, prescaler=${prescaler},clock_divider=${clock_divider} `);
    time_quantum = ((prescaler * clock_divider) / input_clock) * 1e+9;
    console.info(`helper_fdcan_calculate_time_quantum: ${time_quantum}`);
    return time_quantum;
  } catch (e) {
    console.error(`helper_fdcan_calculate_time_quantum: ${e}`);
    return 0;
  }
}

/**
 * Calculate Bit Time
 * @param   {number} bit_time_segment1 Time segment1
 * @param   {number} bit_time_segment2 Time segment2
 * @param   {number} tq Time Quantum in ns
 * @returns {number} Bit Time in ns
 */
function helper_fdcan_calculate_bit_time(bit_time_segment1, bit_time_segment2, tq) {
  let bit_time;
  try {
    console.info(`helper_fdcan_calculate_bit_time: bit_time_segment1=${bit_time_segment1}, bit_time_segment2=${bit_time_segment2}, tq=${tq}`);
    /* Multiply the total number of segments by the time quantum to get the  bit time */
    bit_time = tq * (bit_time_segment1 + bit_time_segment2 + 1);
    console.info(`helper_fdcan_calculate_bit_time: ${bit_time}`);
    return bit_time;
  } catch (e) {
    console.error(`helper_fdcan_calculate_bit_time: ${e}`);
    return 0;
  }
}

/**
  * Calculate  Bitrate of FDCAN
  * @param   {number} input_clock FDCAN input clock
  * @param   {number} prescaler FDCAN prescaler
  * @param   {number} clock_divider FDCAN Clock Divider
  * @param   {number} bit_time_segment1 Bit time segment1
  * @param   {number} bit_time_segment2 Bit time segment2
  * @returns {number} Bitrate in bps
 */
function helper_fdcan_calculate_bitrate(input_clock, prescaler, clock_divider, bit_time_segment1, bit_time_segment2) {
  let bitrate;
  try {
    console.info(`helper_fdcan_calculate_bitrate: input_clock=${input_clock}, prescaler=${prescaler}, clock_divider=${clock_divider}, bit_time_segment1=${bit_time_segment1}, bit_time_segment2=${bit_time_segment2}`);
    bitrate = (input_clock / ((bit_time_segment1 + bit_time_segment2 + 1) * prescaler * clock_divider));
    console.info(`helper_fdcan_calculate_bitrate: bitrate=${bitrate}`);
    return bitrate;
  } catch (e) {
    console.error(`helper_fdcan_calculate_bitrate: ${e}`);
    return 0;
  }
}

/**
 * Calculate sampling point
 * @param   {number} bit_time_segment1 Bit time segment1
 * @param   {number} bit_time_segment2 Bit time segment2
 * @returns {number} Sampling point in permille
 */
function helper_fdcan_calculate_sampling_point(bit_time_segment1, bit_time_segment2) {
  let sampling_point;
  try {
    console.info(`helper_fdcan_calculate_sampling_point: bit_time_segment1=${bit_time_segment1}, bit_time_segment2=${bit_time_segment2}`);
    sampling_point = ((bit_time_segment1 * 1000) + 1000) / (bit_time_segment1 + bit_time_segment2 + 1);
    console.info(`helper_fdcan_calculate_sampling_point: ${sampling_point}`);
    return sampling_point;
  } catch (e) {
    console.error(`helper_fdcan_calculate_sampling_point: ${e}`);
    return 0;
  }
}

/**
 * Compute the FDCAN nominal or data bit timings from input bus parameters.
 * This function mimics the logic of STM32_UTILS_FDCAN_ComputeBitTiming (C),
 * It iterates over possible prescaler values to find a configuration that matches
 * the requested bitrate and sample point within tolerance.
 * @param {Object} bus_param - Input bus parameters:
 *                 {number} fdcan_ker_clk_khz - FDCAN kernel clock in kHz
 *                 {number} desired_bitrate_kbps - Desired bitrate in kbps
 *                 {number} sample_point_per_mille - Desired sample point in permille (e.g. 875 for 87.5%)
 *                 {number} bitrate_tolerance_per_mille - Allowed bitrate deviation in permille
 * @param {string} bit_timing_type - 'nominal' or 'data'
 * @returns {Object} Result object with:
 *                   {Object} bit_timing - { prescaler, time_seg1, time_seg2 }
 *                   {boolean} found_status - true if a valid configuration was found, false otherwise
 */
function helper_fdcan_compute_bit_timing(bus_param, bit_timing_type) {
  /* Memoization: cache results for repeated calls with same parameters */
  const cacheKey = JSON.stringify({ bus_param, bit_timing_type });
  if (fdcan_bit_timing_cache.hasOwnProperty(cacheKey)) {
    return fdcan_bit_timing_cache[cacheKey];
  }
  try {
    /* Timing limits */
    const NOMINAL = { PRESCALER_MIN: 1, PRESCALER_MAX: 512, TIME_SEG1_MIN: 2, TIME_SEG1_MAX: 256, TIME_SEG2_MIN: 2, TIME_SEG2_MAX: 128 };
    const DATA = { PRESCALER_MIN: 1, PRESCALER_MAX: 32, TIME_SEG1_MIN: 1, TIME_SEG1_MAX: 32, TIME_SEG2_MIN: 1, TIME_SEG2_MAX: 16 };

    if (!bus_param) {
      console.error(`helper_fdcan_compute_bit_timing: Invalid input parameter (bus_param is null or undefined)`);
      return {
        bit_timing: { prescaler: 1, time_seg1: 1, time_seg2: 1 },
        found_status: false
      };
    }

    const LIM = (bit_timing_type === 'nominal') ? NOMINAL : DATA;
    let found = false;
    let result = {
      bit_timing: { prescaler: 1, time_seg1: 1, time_seg2: 1 },
      found_status: false
    };

    /* Precompute values as floats */
    const clk = bus_param.fdcan_ker_clk_khz;
    const sp = bus_param.sample_point_per_mille;
    const bitrate = bus_param.desired_bitrate_kbps;
    const tol = bus_param.bitrate_tolerance_per_mille;
    const tmp_multiply_clk_sample_point = clk * sp;
    const tmp_num = (1000 * clk) - tmp_multiply_clk_sample_point;

    for (let prescaler = LIM.PRESCALER_MIN; prescaler <= LIM.PRESCALER_MAX; prescaler++) {
      const product_presc_bitrate = prescaler * bitrate * 1000;
      if (product_presc_bitrate === 0) continue;

      /* Use Math.round for closest integer, but keep all math as float */
      const tseg1 = Math.round(tmp_multiply_clk_sample_point / product_presc_bitrate) - 1;
      const tseg2 = Math.round(tmp_num / product_presc_bitrate);

      if (
        tseg1 >= LIM.TIME_SEG1_MIN && tseg1 <= LIM.TIME_SEG1_MAX &&
        tseg2 >= LIM.TIME_SEG2_MIN && tseg2 <= LIM.TIME_SEG2_MAX
      ) {
        /* Compute real sample point and bitrate as floats */
        const real_sample_point_per_mille = Math.round((1000 + 1000 * tseg1) / (1 + tseg1 + tseg2));
        const real_bitrate_kbps = Math.round((clk * real_sample_point_per_mille) / (1000 * (prescaler * (1 + tseg1))));

        /* Compute deviation in permille */
        const sum = bitrate + real_bitrate_kbps;
        const diff = Math.abs(bitrate - real_bitrate_kbps);
        const deviation = Math.ceil((2 * 1000 * diff) / sum);

        if (deviation > tol) continue;

        /* Found a valid configuration */
        result = {
          bit_timing: {
            prescaler: prescaler,
            time_seg1: tseg1,
            time_seg2: tseg2
          },
          found_status: true
        };
        found = true;
        break;
      }
    }
    if (!found) {
      console.info(`helper_fdcan_compute_bit_timing: No valid parameters found for input:`, bus_param, `bit_timing_type=${bit_timing_type}`);
    }

    /* Store in cache before returning */
    fdcan_bit_timing_cache[cacheKey] = result;
    return result;
  } catch (e) {
    console.error(`helper_fdcan_compute_bit_timing: ${e}`);
    const errorResult = {
      bit_timing: { prescaler: 1, time_seg1: 1, time_seg2: 1 },
      found_status: false
    };
    fdcan_bit_timing_cache[cacheKey] = errorResult;
    return errorResult;
  }
}

/**
  * Retrieve all the interruptions set by FDCAN but not generated
  * @param {object} nvic_api Getter on NVIC api
  * @param {object} exti_api Getter on EXTI api
  * @param {object} resource Current resource
  * @param {object} config   Current configuration of the FDCAN
  * @returns {object}
  */
function helper_fdcan_get_irq_handler(nvic_api, exti_api, resource, config) {
  let result = [];
  try {
    console.info(`helper_fdcan_get_irq_handler: resource=${resource}, config=${JSON.stringify(config)}`
    );

    /* Reference all the elements which enable the FDCAN interruptions */
    const list_interrupts = [
      { enable: "enable_interrupt_line0", irq_handler_generation: "irq_handler_generation_line0", nvic_context: "nvic_config_line0", selector: "_IT0" },
      { enable: "enable_interrupt_line1", irq_handler_generation: "irq_handler_generation_line1", nvic_context: "nvic_config_line1", selector: "_IT1" },
    ];

    /* Parse the list of interruptions */
    for (let index = 0; index < list_interrupts.length; index++) {
      const element = list_interrupts[index];
      /* Check if interruption has beenn enabled on the FDCAN */
      const enableInterruption = config?.system?.nvic?.[element['enable']] ?? false;
      if (!enableInterruption) continue;

      /* Check if IRQ handler generated is done on code generation or not */
      const irqHandlerGeneration = config.system?.nvic?.[element['irq_handler_generation']] ?? false;

      if (!irqHandlerGeneration) {
        const labels = config.info?.labels || [];
        const nvic_config = nvic_api.getNeedById(config.system?.nvic?.[element['nvic_context']].needs[0].id);
        /* Fill the object to be used for aliases in mx_hal_def.h */
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
    console.error(`helper_fdcan_get_irq_handler: ${e}`);
  }
  return result;
}

/**
 * @brief Analyze the status_msg_interrupts group and return enabled Tx complete and abort buffer macros.
 *
 * This function inspects the FDCAN interrupt configuration group (status_msg_interrupts)
 * and determines which Tx complete and Tx abort buffer interrupts are enabled.
 *
 * For each buffer (0, 1, 2), if enabled, the corresponding macro is included:
 *   - HAL_FDCAN_IT_TX_CPLT_BUFFER_0/1/2 for complete
 *   - HAL_FDCAN_IT_TX_ABORT_BUFFER_0/1/2 for abort
 *
 * If all three are enabled, returns HAL_FDCAN_IT_TX_CPLT_BUFFER_ALL or HAL_FDCAN_IT_TX_ABORT_BUFFER_ALL.
 * If none are enabled, it returns an empty string for that group.
 *
 * @param {object} status_msg_interrupts The 'status_msg_interrupts' group from interrupts config.
 * @return {object} Object with:
 *   - tx_complete_buffers: { funcLabel, commentLabel, value } for Tx complete
 *   - tx_abort_buffers: { funcLabel, commentLabel, value } for Tx abort
 */
function helper_fdcan_buffer_interrupts(status_msg_interrupts) {
  /* Prepare result objects for Tx complete and abort */
  let tx_complete = {
    funcLabel: 'TxBufferComplete',
    commentLabel: 'Tx complete buffer',
    value: ''
  };
  let tx_abort = {
    funcLabel: 'TxBufferCancellation',
    commentLabel: 'Tx abort complete buffer',
    value: ''
  };

  /* Check Tx complete buffer group */
  if (
    status_msg_interrupts &&
    status_msg_interrupts.it_tx_complete &&
    status_msg_interrupts.tx_complete_buffer
  )
  {
    /* Collect enabled macros for Tx complete */
    const buf = status_msg_interrupts.tx_complete_buffer;
    const macros = [
      buf.buffer_0 ? 'HAL_FDCAN_IT_TX_CPLT_BUFFER_0' : null,
      buf.buffer_1 ? 'HAL_FDCAN_IT_TX_CPLT_BUFFER_1' : null,
      buf.buffer_2 ? 'HAL_FDCAN_IT_TX_CPLT_BUFFER_2' : null
    ].filter(Boolean);
    /* If all enabled, use ALL macro */
    if (macros.length === 3) {
      tx_complete.value = 'HAL_FDCAN_IT_TX_CPLT_BUFFER_ALL';
    } else if (macros.length > 0) {
      /* Otherwise, join enabled macros */
      tx_complete.value = macros.join('\n                                                          | ');
    }
  }

  /* Check Tx abort buffer group */
  if (
    status_msg_interrupts &&
    status_msg_interrupts.it_tx_abort_complete &&
    status_msg_interrupts.tx_abort_complete_buffer
  )
  {
    /* Collect enabled macros for Tx abort */
    const buf = status_msg_interrupts.tx_abort_complete_buffer;
    const macros = [
      buf.buffer_0 ? 'HAL_FDCAN_IT_TX_ABORT_BUFFER_0' : null,
      buf.buffer_1 ? 'HAL_FDCAN_IT_TX_ABORT_BUFFER_1' : null,
      buf.buffer_2 ? 'HAL_FDCAN_IT_TX_ABORT_BUFFER_2' : null
    ].filter(Boolean);
    /* If all enabled, use ALL macro */
    if (macros.length === 3) {
      tx_abort.value = 'HAL_FDCAN_IT_TX_ABORT_BUFFER_ALL';
    } else if (macros.length > 0) {
      /* Otherwise, join enabled macros */
      tx_abort.value = macros.join('\n                                                              | ');
    }
  }

  /* Return both Tx complete and abort buffer macros */
  return {
    tx_complete_buffers: tx_complete,
    tx_abort_buffers: tx_abort
  };
}

/**
 * @brief Group FDCAN interrupts by line and collect buffer macros.
 *
 * This function organizes interrupts into line 0 and line 1, and collects
 * Tx complete and abort buffer macros using helper_fdcan_buffer_interrupts.
 *
 * @param {object} interrupts - FDCAN interrupts configuration object.
 * @return {object} {
 *   all_interrupts: [individual, txComplete, txAbort],
 *   interrupts_by_line: [line0, line1],
 *   lines: string
 * }
 */
function helper_fdcan_interrupts_by_line(interrupts) {
  /* If no interrupts object is provided, return empty structure */
  if (!interrupts) {
    console.error(`helper_fdcan_interrupts_by_line: interrupts parameter is null or undefined`);
    return { all_interrupts: [""], interrupts_by_line: ["", ""], lines: "" };
  }

  /* Helper function: Group interrupt macros by their assigned line (LINE_0 or LINE_1) */
  function groupByLine(interrupts) {
    const line0 = []; /* Macros for interrupts on line 0 */
    const line1 = []; /* Macros for interrupts on line 1 */
    const all = [];   /* All enabled interrupts (any line) */
    /* Iterate over each interrupt group */
    for (const [groupName, group] of Object.entries(interrupts)) {
      /* Iterate over each interrupt in the group */
      for (const [interruptName, interrupt] of Object.entries(group)) {
        /* Only process actual interrupt entries (skip meta fields) */
        if (
          interrupt &&
          !interruptName.includes("interrupt_lines") &&
          !interruptName.includes("complete_buffer")
        ) {
          /* Compose macro for the group */
          const macro = `HAL_FDCAN_IT_GROUP_${groupName.replace(/_interrupts$/, "").toUpperCase()}`;
          const line = group.interrupt_lines; /* Get which line this group is assigned to */
          /* Add macro to the correct line array if not already present */
          if (line === "LINE_0" && !line0.includes(macro)) line0.push(macro);
          else if (line === "LINE_1" && !line1.includes(macro)) line1.push(macro);
          /* Add the specific interrupt macro to the all list */
          all.push(`HAL_FDCAN_${interruptName.toUpperCase()}`);
        }
      }
    }
    return { line0, line1, all };
  }

  /* Helper function: Format macro arrays for output (for code generation or display) */
  function formatMacros(macros) {
    return macros.join("\n                                         | ");
  }

  /* Group all interrupts by line and collect all macros */
  const { line0, line1, all } = groupByLine(interrupts);

  /* Determine which interrupt lines are used (for summary macro) */
  let lines = "";
  if (line0.length && line1.length) lines = "HAL_FDCAN_IT_LINE_0 | HAL_FDCAN_IT_LINE_1";
  else if (line0.length) lines = "HAL_FDCAN_IT_LINE_0";
  else if (line1.length) lines = "HAL_FDCAN_IT_LINE_1";

  /* Get buffer macros for Tx complete and abort using the helper */
  let bufferInfo;
  try {
    bufferInfo = helper_fdcan_buffer_interrupts(interrupts.status_msg_interrupts || {});
  } catch (e) {
    /* Fallback: If buffer macro extraction fails, use empty defaults */
    console.error(`helper_fdcan_interrupts_by_line: bufferInfo fallback due to ${e}`);
    bufferInfo = {
      tx_complete_buffers: { funcLabel: 'TxBufferComplete', commentLabel: 'Tx complete buffer', value: '' },
      tx_abort_buffers: { funcLabel: 'TxBufferCancellation', commentLabel: 'Tx abort complete buffer', value: '' }
    };
  }

  /* Build and return the result object: */
  /* - all_interrupts: [all individual macros, tx complete macros, tx abort macros] */
  /* - interrupts_by_line: [macros for line0, macros for line1] */
  /* - lines: summary macro for which lines are used */
  return {
    all_interrupts: [
      { funcLabel: '', commentLabel: 'individual', value: formatMacros(all) },
      bufferInfo.tx_complete_buffers,
      bufferInfo.tx_abort_buffers
    ],
    interrupts_by_line: [formatMacros(line0), formatMacros(line1)],
    lines
  };
}

module.exports = {
  helper_fdcan_calculate_bitrate,
  helper_fdcan_calculate_time_quantum,
  helper_fdcan_calculate_bit_time,
  helper_fdcan_calculate_sampling_point,
  helper_fdcan_compute_bit_timing,
  helper_fdcan_get_irq_handler,
  helper_fdcan_interrupts_by_line
};
