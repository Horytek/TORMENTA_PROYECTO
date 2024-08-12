import React, { forwardRef } from "react";
import { useInput } from "@nextui-org/react";
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

  const onClear = () => {
    setValue("");
  };

  const end = React.useMemo(() => {
    if (isClearable) {
      return (
        <span {...getClearButtonProps()} onClick={onClear}>
          <CloseFilledIcon />
        </span>
      );
    } else if (endContent) {
      return endContent;
    }
    return null;
  }, [isClearable, getClearButtonProps, endContent]);

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
