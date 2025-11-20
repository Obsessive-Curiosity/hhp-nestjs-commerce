import { Entity, PrimaryKey, Property, t, Index } from '@mikro-orm/core';
import { CreateAddressProps, UpdateAddressProps } from '../types';

@Entity()
@Index({ name: 'fk_address_userId', properties: ['userId'] })
export class Address {
  @PrimaryKey()
  id!: number;

  // User 엔티티를 참조 (N:1 관계)
  @Property({ type: t.character, length: 36 })
  userId!: string;

  @Property()
  zipCode!: string; // 우편번호

  @Property()
  road!: string; // 도로명 주소 또는 지번 주소

  @Property()
  detail!: string; // 상세 주소

  @Property()
  city!: string; // 시/도

  @Property()
  district!: string; // 구/군

  @Property()
  town!: string; // 동/읍/면

  @Property()
  recipientName!: string; // 수령인 이름

  @Property()
  phone!: string; // 수령인 전화번호

  @Property({ default: false })
  isDefault: boolean; // 기본 배송지 여부

  // =================== Constructor ===================

  protected constructor(data?: Partial<Address>) {
    if (data) {
      Object.assign(this, data);
    }
  }

  // ================== Factory (생성) ==================
  static create(props: CreateAddressProps): Address {
    const address = new Address();

    address.userId = props.userId;
    address.zipCode = props.zipCode;
    address.road = props.road;
    address.detail = props.detail;
    address.city = props.city;
    address.district = props.district;
    address.town = props.town;
    address.recipientName = props.recipientName;
    address.phone = props.phone;
    address.isDefault = props.isDefault ?? false;

    return address;
  }
  // ======================= 조회 =======================
  // 기본 배송지 여부 확인
  isDefaultAddress(): boolean {
    return this.isDefault === true;
  }

  // 전체 주소 문자열 반환
  toString(): string {
    return `${this.road} ${this.detail} (${this.zipCode}), ${this.city} ${this.district} ${this.town}`;
  }

  // 주문용 주소 포맷 (city district town road)
  getOrderAddress(): string {
    return `${this.city} ${this.district} ${this.town} ${this.road}`;
  }

  // ======================= 수정 =======================
  update(props: UpdateAddressProps) {
    if (props.zipCode) this.zipCode = props.zipCode;
    if (props.road) this.road = props.road;
    if (props.detail) this.detail = props.detail;
    if (props.city) this.city = props.city;
    if (props.district) this.district = props.district;
    if (props.town) this.town = props.town;
    if (props.recipientName) this.recipientName = props.recipientName;
    if (props.phone) this.phone = props.phone;
    if (typeof props.isDefault === 'boolean') this.isDefault = props.isDefault;
  }

  setDefault() {
    this.isDefault = true;
  }

  unsetDefault() {
    this.isDefault = false;
  }
}
