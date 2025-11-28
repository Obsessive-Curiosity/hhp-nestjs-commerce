import { Address } from '@/modules/user/domain/entity/address.entity';

// 주소 정보
export class AddressInfoResponseDto {
  id: number;
  zipCode: string;
  road: string;
  detail: string | null;
  city: string;
  district: string;
  town: string | null;
  isDefault: boolean;

  static from(address: Address): AddressInfoResponseDto {
    const dto = new AddressInfoResponseDto();
    dto.id = address.id;
    dto.zipCode = address.zipCode;
    dto.road = address.road;
    dto.detail = address.detail ?? null;
    dto.city = address.city;
    dto.district = address.district;
    dto.town = address.town ?? null;
    dto.isDefault = address.isDefault;
    return dto;
  }
}

// 주소 목록 조회 응답
export class GetAddressesResponseDto {
  addresses: AddressInfoResponseDto[];

  static from(addresses: Address[]): GetAddressesResponseDto {
    const dto = new GetAddressesResponseDto();
    dto.addresses = addresses.map((address) => AddressInfoResponseDto.from(address));
    return dto;
  }
}

// 기본 배송지 조회 응답
export class GetDefaultAddressResponseDto {
  message: string | null;
  address: AddressInfoResponseDto | null;

  static from(address: Address | null): GetDefaultAddressResponseDto {
    const dto = new GetDefaultAddressResponseDto();
    if (!address) {
      dto.message = '기본 배송지가 설정되지 않았습니다.';
      dto.address = null;
    } else {
      dto.message = null;
      dto.address = AddressInfoResponseDto.from(address);
    }
    return dto;
  }
}

// 주소 생성 응답
export class CreateAddressResponseDto {
  message: string;
  address: AddressInfoResponseDto;

  static from(address: Address): CreateAddressResponseDto {
    const dto = new CreateAddressResponseDto();
    dto.message = '주소가 생성되었습니다.';
    dto.address = AddressInfoResponseDto.from(address);
    return dto;
  }
}

// 주소 수정 응답
export class UpdateAddressResponseDto {
  message: string;
  address: AddressInfoResponseDto;

  static from(address: Address): UpdateAddressResponseDto {
    const dto = new UpdateAddressResponseDto();
    dto.message = '주소가 수정되었습니다.';
    dto.address = AddressInfoResponseDto.from(address);
    return dto;
  }
}

// 기본 배송지 설정 응답
export class SetDefaultAddressResponseDto {
  message: string;
  address: AddressInfoResponseDto;

  static from(address: Address): SetDefaultAddressResponseDto {
    const dto = new SetDefaultAddressResponseDto();
    dto.message = '기본 배송지가 설정되었습니다.';
    dto.address = AddressInfoResponseDto.from(address);
    return dto;
  }
}

// 주소 삭제 응답
export class DeleteAddressResponseDto {
  message: string;

  static from(): DeleteAddressResponseDto {
    const dto = new DeleteAddressResponseDto();
    dto.message = '주소가 삭제되었습니다.';
    return dto;
  }
}
