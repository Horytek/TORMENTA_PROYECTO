import React, { forwardRef } from "react";
import { OTPInput } from "input-otp";

import { cn } from "@/lib/utils";

const DEFAULT_SEGMENT_CLASSNAME =
  "w-14 h-14 rounded-lg text-2xl font-semibold flex items-center justify-center select-none bg-zinc-800/50 border border-white/10 text-white shadow-none transition-colors";

const DEFAULT_ACTIVE_CLASSNAME = "ring-2 ring-emerald-500 border-emerald-500";

const DEFAULT_CARET_CLASSNAME =
  "w-px h-6 bg-white/80 animate-caret-blink";

/**
 * OTP input con estética tipo HeroUI pero 100% controlada.
 * - No depende de slots internos de HeroUI.
 * - Usa `input-otp` para toda la lógica de foco/pegado.
 */
const OtpInput = forwardRef(
  (
    {
      length = 4,
      value,
      onValueChange,
      containerClassName,
      segmentClassName,
      activeSegmentClassName,
      separator,
      inputClassName,
      ...props
    },
    ref
  ) => {
    return (
      <OTPInput
        ref={ref}
        value={value}
        onChange={onValueChange}
        maxLength={length}
        inputMode="numeric"
        pattern="^[0-9]*$"
        containerClassName={cn("relative flex items-center justify-center", containerClassName)}
        className={cn(
          "absolute inset-0 w-full h-full opacity-0 z-10 cursor-text",
          inputClassName
        )}
        render={({ slots }) => (
          <div className="flex items-center justify-center gap-3">
            {slots.slice(0, length).map((slot, index) => {
              const isActive = !!slot.isActive;
              const showCaret = isActive && !slot.char && slot.hasFakeCaret;

              return (
                <React.Fragment key={index}>
                  {index > 0 && separator ? separator : null}
                  <div
                    data-active={isActive}
                    className={cn(
                      DEFAULT_SEGMENT_CLASSNAME,
                      segmentClassName,
                      isActive && (activeSegmentClassName || DEFAULT_ACTIVE_CLASSNAME)
                    )}
                  >
                    {slot.char ? (
                      <span>{slot.char}</span>
                    ) : showCaret ? (
                      <span className={DEFAULT_CARET_CLASSNAME} />
                    ) : (
                      <span className="text-white/20">&nbsp;</span>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
        {...props}
      />
    );
  }
);

OtpInput.displayName = "OtpInput";

export default OtpInput;
