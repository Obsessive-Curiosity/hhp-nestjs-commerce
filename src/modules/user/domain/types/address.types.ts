export type CreateAddressProps = {
  userId: string;
  zipCode: string;
  road: string;
  detail: string;
  city: string;
  district: string;
  town: string;
  recipientName: string;
  phone: string;
  isDefault?: boolean;
};

export type UpdateAddressProps = {
  zipCode?: string;
  road?: string;
  detail?: string;
  city?: string;
  district?: string;
  town?: string;
  recipientName?: string;
  phone?: string;
  isDefault?: boolean;
};
