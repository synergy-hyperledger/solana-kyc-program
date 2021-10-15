use borsh::{BorshDeserialize, BorshSerialize};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, BorshDeserialize, BorshSerialize, Clone)]
pub struct CustomerData {
    pub instruction: String,
    pub customer_id: String,
    pub legal_name: String,
    pub registration_number: String,
    pub incorporation_country: String,
    pub lei_registration_status: String,
    pub lei: String,
    pub incorporation_date: String,
    pub primary_country_operation: String,
    pub primary_isic_code: String,
    pub entity_type: String,
    pub swift_code: String,
    pub kyc_status: bool,
    pub is_active: bool,
 //   pub addresses: Vec<AddressData>,
   // pub kyc_documents: Vec<KycDocument>,
}

#[derive(Debug, Deserialize, Serialize, BorshDeserialize, BorshSerialize, Clone)]
pub struct AddressData {
    pub address_type: String,
    pub address_line1: String,
    pub address_line2: String,
    pub city: String,
    pub state: String,
    pub country: String,
    pub postal_code: String,
}

#[derive(Debug, Deserialize, Serialize, BorshDeserialize, BorshSerialize, Clone)]
pub struct KycDocument {
    pub document_id: String,
    pub document_name: String,
    pub document_category: String,
    pub document_status: String,
    pub last_modified: String,
    pub ipfs_transaction_id: String,
}

#[derive(Debug, Deserialize, Serialize, BorshDeserialize, BorshSerialize, Clone)]
pub struct CustomerDataList {
    pub data: Vec<CustomerData>,
}