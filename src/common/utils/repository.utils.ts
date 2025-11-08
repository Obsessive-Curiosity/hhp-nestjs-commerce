/**
 * Repository 공통 유틸리티 함수들
 */

/**
 * Dirty Field 기반으로 변경된 필드만 업데이트 객체에 할당
 * @param source 원본 객체 (모든 필드)
 * @param target 타겟 객체 (업데이트할 필드만 담을 객체)
 * @param dirtyFields 변경된 필드 목록
 */

export function assignDirtyFields<T extends object>(
  source: T,
  target: Partial<T>,
  dirtyFields: (keyof T)[],
) {
  dirtyFields.forEach((key) => {
    if (key in source) {
      target[key] = source[key];
    }
  });
}
