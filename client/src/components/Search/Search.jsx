import React, { forwardRef } from "react";
import { useInput } from '@heroui/react';
import { SearchIcon } from "./SearchIcon";
import { CloseFilledIcon } from "./CloseFilledIcon";

const styles = {
  label: "text-slate-500 dark:text-slate-400 font-medium",
  input: [
    "bg-transparent",
    "text-sm text-slate-700 dark:text-slate-200",
    "font-medium",
    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
    "focus:outline-none",
    "border-none",
    "shadow-none",
    "focus:ring-0",
    "h-full"
  ],
  innerWrapper: "bg-transparent flex items-center h-full gap-2",
  inputWrapper: [
    "h-11", // Height 11 (2.75rem)
    "bg-slate-50 dark:bg-zinc-900", // Darker background to blend
    "border border-slate-200 dark:border-transparent", // No border in dark mode
    "hover:bg-white dark:hover:bg-zinc-800", // Hover
    "transition-all duration-200",
    "rounded-xl", // Rounded
    "!shadow-none dark:!shadow-none", // Force no shadow
    "px-3",
    "!cursor-text",
    "flex items-center",
    "group-data-[focus=true]:!ring-0", // Prevent focus ring
    "group-data-[focus=true]:!ring-offset-0"
  ],
};

import { useQueryState, parseAsString } from 'nuqs';

const BarraSearch = forwardRef((props, ref) => {
  // Use nuqs to sync with URL 'q' parameter
  const [query, setQuery] = useQueryState('q', parseAsString.withDefault('').withOptions({ shallow: false }));

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
    value: query, // Bind to URL state
    onValueChange: setQuery, // Update URL on type
    type: "search",
    startContent: (
      <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
    ),
    classNames: {
      ...styles,
      ...props.classNames,
    },
  });

  const labelContent = <label {...getLabelProps()}>{label}</label>;

  const handleClear = (e) => {
    // Evitar propagación si es necesario
    e?.stopPropagation();

    // 1. Limpiar estado interno y URL
    setQuery(null); // or ""

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
