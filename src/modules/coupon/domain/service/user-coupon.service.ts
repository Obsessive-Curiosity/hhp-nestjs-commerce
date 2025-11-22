import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserCoupon, CouponStatus } from '../entity/user-coupon.entity';
import { Coupon } from '../entity/coupon.entity';
import {
  IUserCouponRepository,
  USER_COUPON_REPOSITORY,
} from '../interface/user-coupon.repository.interface';
import {
  ICouponRepository,
  COUPON_REPOSITORY,
} from '../interface/coupon.repository.interface';

@Injectable()
export class UserCouponService {
  constructor(
    @Inject(USER_COUPON_REPOSITORY)
    private readonly userCouponRepository: IUserCouponRepository,
    @Inject(COUPON_REPOSITORY)
    private readonly couponRepository: ICouponRepository,
  ) {}

  // ==================== 조회 (Query) ====================

  // BR-039: 중복 발급 확인
  checkDuplicateIssue(userId: string, couponId: string): Promise<boolean> {
    return this.userCouponRepository.hasCoupon(userId, couponId);
  }

  // 사용자의 쿠폰 목록 조회
  async findUserCoupons(
    userId: string,
    status?: CouponStatus,
  ): Promise<UserCoupon[]> {
    return this.userCouponRepository.findByUserId(userId, status);
  }

  // 사용자의 사용 가능한 쿠폰 조회
  async findAvailableCoupons(userId: string): Promise<UserCoupon[]> {
    return this.userCouponRepository.findAvailableCouponsByUserId(userId);
  }

  // ==================== 생성 (Create) ====================

  // BR-040: UserCoupon 발급
  async issueCoupon(userId: string, coupon: Coupon): Promise<UserCoupon> {
    // 중복 발급 확인
    const alreadyIssued = await this.checkDuplicateIssue(userId, coupon.id);
    if (alreadyIssued) {
      throw new BadRequestException('이미 발급받은 쿠폰입니다.');
    }

    // BR-040: 만료일 계산
    const expiredAt = coupon.calculateExpiredAt();

    // UserCoupon 생성
    const userCoupon = UserCoupon.create({
      userId,
      couponId: coupon.id,
      expiredAt,
    });

    // Repository를 통해 저장
    return this.userCouponRepository.create(userCoupon);
  }

  // ==================== 수정 (Update) ====================

  // BR-047: 쿠폰 사용
  async useCoupon(userCouponId: string): Promise<UserCoupon> {
    const userCoupon = await this.userCouponRepository.findById(userCouponId);
    if (!userCoupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    // Domain Entity에서 비즈니스 규칙 검증
    userCoupon.use();

    // Repository를 통해 저장
    return this.userCouponRepository.update(userCoupon);
  }

  // BR-054: 쿠폰 복구 (주문 취소 시)
  async restoreCoupon(userCouponId: string): Promise<UserCoupon> {
    const userCoupon = await this.userCouponRepository.findById(userCouponId);
    if (!userCoupon) {
      throw new NotFoundException('쿠폰을 찾을 수 없습니다.');
    }

    // Domain Entity에서 비즈니스 규칙 검증
    userCoupon.restore();

    // Repository를 통해 저장
    return this.userCouponRepository.update(userCoupon);
  }

  // ==================== 배치 작업 (Batch) ====================

  // 만료된 쿠폰 처리 (스케줄러용)
  async expireExpiredCoupons(): Promise<void> {
    const expiredCoupons = await this.userCouponRepository.findExpiredCoupons();
    if (expiredCoupons.length === 0) {
      return;
    }

    const userCouponIds = expiredCoupons.map((uc) => uc.id);
    await this.userCouponRepository.expireCoupons(userCouponIds);
  }
}
