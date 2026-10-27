export class PageResponseDto<T> {
  constructor(
    public readonly content: T[],
    public readonly pageNumber: number,
    public readonly size: number,
    public readonly totalElements: number,
    public readonly totalPages: number,
  ) {}
}
