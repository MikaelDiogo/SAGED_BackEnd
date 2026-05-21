export class AccessDeniedError extends Error {
  constructor(message: string = "Acesso negado.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}
// acessdenied 