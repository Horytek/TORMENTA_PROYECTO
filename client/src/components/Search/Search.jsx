import React, { forwardRef } from "react";
import { useInput } from '@heroui/react';
import { SearchIcon } from "./SearchIcon";
import { CloseFilledIcon } from "./CloseFilledIcon";

const styles = {
  label: "text-black/50 dark:text-white/90",
  input: [
    "bg-transparent",
    "text-black/90 dark:text-white/90",
    "placeholder:text-default-700/50 dark:placeholder:text-white/60",
    "focus:outline-none",
    "border-none",
    "shadow-none",
    "focus:ring-0",
    "py-2",
    "leading-normal",
    "w-full",
    "overflow-hidden",
    "text-ellipsis",
  ],
  innerWrapper: "bg-transparent flex items-center",
  inputWrapper: [
    "shadow-none",
    "border-none",
    "bg-default-200/50",
    "dark:bg-default/60",
    "backdrop-blur-xl",
    "backdrop-saturate-200",
    "hover:bg-default-200/70",
    "focus-within:bg-default-200/50",
    "dark:hover:bg-default/70",
    "dark:focus-within:bg-default/60",
    "!cursor-text",
    "flex",
    "items-center",
    "px-5",
    "w-full",
  ],
};

const BarraSearch = forwardRef((props, ref) => {
  const {
    Component,
    label,
    placeholder,
    domRef,
    description,
    isClearable,
    startContent,
    endContent,
    shouldLabelBeOutside,
    shouldLabelBeInside,
    errorMessage,
    getBaseProps,
    getLabelProps,
    getInputProps,
    getInnerWrapperProps,
    getInputWrapperProps,
    getDescriptionProps,
    getErrorMessageProps,
    getClearButtonProps,
    setValue,
  } = useInput({
    ...props,
    ref,
    type: "search",
    startContent: (
      <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
    ),
    classNames: {
      ...styles,
    },
  });

  const labelContent = <label {...getLabelProps()}>{label}</label>;

  const handleClear = (e) => {
    // Evitar propagación si es necesario
    e?.stopPropagation();

    // 1. Limpiar estado interno
    setValue("");

    // 2. Notificar cambio de valor al padre (esencial para formularios controlados)
    if (props.onValueChange) {
      props.onValueChange("");
    }

    // 3. Notificar evento de limpieza específico
    if (props.onClear) {
      props.onClear();
    }

    // 4. Enfocar el input nuevamente para UX fluida
    domRef.current?.focus();
  };

  const end = React.useMemo(() => {
    if (isClearable) {
      // Combinar props del hook con nuestro manejador personalizado
      const clearProps = getClearButtonProps();
      return (
        <span
          {...clearProps}
          onClick={(e) => {
            // Ejecutar lógica del hook si existe
            clearProps?.onClick?.(e);
            // Ejecutar nuestra lógica completa
            handleClear(e);
          }}
          className="cursor-pointer text-default-400 hover:text-default-500 active:opacity-70 transition-opacity"
        >
          <CloseFilledIcon />
        </span>
      );
    } else if (endContent) {
      return endContent;
    }
    return null;
  }, [isClearable, getClearButtonProps, endContent, props.onValueChange, props.onClear]);

  const innerWrapper = React.useMemo(() => {
    return (
      <div {...getInnerWrapperProps()}>
        {startContent}
        <input {...getInputProps()} />
        {end}
      </div>
    );
  }, [startContent, end, getInputProps, getInnerWrapperProps]);

  return (
    <Component {...getBaseProps()}>
      {shouldLabelBeOutside ? labelContent : null}
      <div
        {...getInputWrapperProps()}
        role="button"
        onClick={() => {
          domRef.current?.focus();
        }}
      >
        {shouldLabelBeInside ? labelContent : null}
        {innerWrapper}
      </div>
      {description && <div {...getDescriptionProps()}>{description}</div>}
      {errorMessage && <div {...getErrorMessageProps()}>{errorMessage}</div>}
    </Component>
  );
});

BarraSearch.displayName = "BarraSearch";

export default BarraSearch;
