import { Point } from '../entity/point.entity';

export const POINT_REPOSITORY = Symbol('POINT_REPOSITORY');

export interface IPointRepository {
  // Point 조회
  findByUserId(userId: string): Promise<Point | null>;

  // Point 저장 (생성/수정)
  save(point: Point): Promise<Point>;
}
