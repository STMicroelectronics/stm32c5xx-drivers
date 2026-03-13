

# Release Notes for
# <mark>STM32C5xx HAL Drivers SW Pack</mark>

[![ST logo](_htmresc/st_logo_2020.png)](https://www.st.com)

# Purpose

STM32Cube enables developers to achieve design success. With a comprehensive suite of professional development tools and embedded software components, STM32Cube allows developers to differentiate products, streamline design cycles, and reduce costs. STM32Cube ecosystem supports all design steps, including selection, configuration, development, debugging, programming, and monitoring.

The STM32Cube embedded software offer provides ready-to-use software components that can be added to a project. It includes STM32 peripheral driver APIs with two levels of abstraction, middleware, board drivers, and examples. There are several distribution channels, including the STM32CubeMX2 tool, the ST website, and GitHub. All embedded software comes with enhanced online documentation, with flowcharts and user sequences.

More detailed documentation is available at [STM32C5xx HAL Drivers online documentation](https://dev.st.com/stm32cube-docs/stm32c5xx-hal-drivers/latest/en/index.html)


# Update History

<label for="collapse-section-2.0.0" aria-hidden="true">__2.0.0 / 13-March-2026__</label>
<div>

## Main changes

### First Official release of **STM32C5xx HAL Drivers**


## Contents

- **HAL/LL Drivers** are available for all peripherals:
  - **System** : CORTEX, CRS, DBGMCU, DMA (Q), ICACHE, IWDG, PWR, RCC, RTC, SBS, WWDG
  - **I/O** : EXTI, GPIO
  - **Analog** : ADC, COMP, DAC, OPAMP
  - **Timers** : TIM, LPTIM
  - **Connectivity** : FDCAN, I2C, I3C, SMARTCARD, SMBUS, I2S, SPI, UART, LPUART, USART, USB (HCD/PCD), ETH
  - **Security** : AES, CCB, HASH, PKA, RNG, TAMP
  - **Computing** : CORDIC, CRC
  - **Memory** : FLASH, RAMCFG, XSPI (DLYB)
  - **Common** : OS, Timebases, Templates
- **Utils** are available for FDCAN, I2C, I3C peripherals.
 


## Development toolchains and compilers

- IAR Embedded Workbench for ARM (EWARM) toolchain V9.60.3 + ST-LINK
- MDK-ARM Keil uVision V5.42
- STM32CubeIDE for Visual Studio Code (GCC13 compiler)
- STM32CubeMX2 V1.0.0


## Supported devices and boards

- STM32C551xx, STM32C552xx, STM32C562xx devices
- STM32C531xx, STM32C532xx, STM32C542xx devices
- STM32C591xx, STM32C593xx, STM32C5A3xx devices
- NUCLEO-C562RE, NUCLEO-C542RC, NUCLEO-C5A3ZG boards


## Known limitations

- HAL ETH
  - PTP, hardware timestamping, MAC VLAN tagging and advanced MAC filtering features are not supported in this driver version and will be considered for a future release.
- HAL HASH
	- When using HAL_HASH_Update_DMA(), no interrupt is triggered when the input is smaller than the DMA block size (4 words).
	- When using HAL_HASH_Update_IT(), no interrupt is triggered when the input is smaller than the block size.
- HAL I2C
	- As defined by MIPI, I2C stretch mode is not supported in I3C communication.
- HAL I2S
	- Using the -Oz optimization in ARMCC6.24.0 may reorder peripheral memory accesses causing initialization and execution issues in HAL I2S driver.
- HAL I3C
  - Acknowledgement issue is observed after 2 consecutive aborts (interrupt race condition).


## Backward compatibility

- None


## Dependencies

- STM32C5xx DFP 2.0.0


</div>



<footer class="sticky">
For complete documentation on STM32 Microcontrollers </mark> ,
visit: http://www.st.com/stm32

This release note uses up to date web standards and, for this reason, should not
be opened with Internet Explorer but preferably with popular browsers such as
Google Chrome, Mozilla Firefox, Opera or Microsoft Edge.
</footer>