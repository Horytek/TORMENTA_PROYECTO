import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { apiErrorMessage } from "./apiErrorMessage";

describe("apiErrorMessage", () => {
  it("extrae message del backend", () => {
    const err = new AxiosError("Request failed with status code 400");
    err.response = {
      status: 400,
      data: { message: "Hay stock disponible. Puedes comprar ahora sin solicitud." },
    } as never;
    expect(apiErrorMessage(err)).toBe("Hay stock disponible. Puedes comprar ahora sin solicitud.");
  });

  it("une arrays de validación zod", () => {
    const err = new AxiosError("Request failed with status code 400");
    err.response = {
      status: 400,
      data: { message: ["Expected number", "Required"] },
    } as never;
    expect(apiErrorMessage(err)).toBe("Expected number. Required");
  });
});
