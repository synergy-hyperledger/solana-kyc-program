use borsh::{BorshSerialize};
use serde::{Serialize, Deserialize};
use solana_program::borsh::try_from_slice_unchecked;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

use crate::{error::CustomerDataError, state::CustomerData, state::CustomerDataList};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        msg!("Processing Customer Data");
        let accounts_iter = &mut accounts.iter();
        let account = next_account_info(accounts_iter)?;

        if account.owner != program_id {
            msg!("Invalid Program Id");
            return Err(CustomerDataError::InvalidInstruction.into());
        }

        let data = String::from_utf8(instruction_data.to_vec()).map_err(|_err| {
            msg!("Invalid UTF-8, from byte {}");
            ProgramError::InvalidInstructionData
        })?;

        let payload = String::from(data.chars().as_str());
        msg!("Request Payload is {}", payload);
        let customer: CustomerData = serde_json::from_str(&payload).unwrap();

        match customer.instruction.as_ref() {
            "CreateCustomer" => {
                msg!("Creating Customer Data");
                let mut customers = try_from_slice_unchecked(&account.data.borrow()[..])?;
                Self::create_customer(customer, &mut customers);
                msg!("Account Data updated as {:?}", &customers);
                Ok(BorshSerialize::serialize(
                    &customers,
                    &mut &mut account.data.borrow_mut()[..],
                )?)
            }
            "GetCustomer" => {
                msg!("GET Operation");
                Ok(())
            }
            "UpdateKycStatus" => {
                msg!("Updating Customer Data");
                let mut customers = try_from_slice_unchecked(&account.data.borrow()[..])?;
                Self::update_customer(customer, &mut customers);
                msg!("Account Data updated as {:?}", &customers);
                Ok(BorshSerialize::serialize(
                    &customers,
                    &mut &mut account.data.borrow_mut()[..],
                )?)
            }
            _ => Ok(()),
        }
    }

    pub fn create_customer(customer: CustomerData, customers: &mut CustomerDataList) {
        msg!("Adding Customer Data {:?}", &customers);
        customers.data.push(customer);
    }

    pub fn update_customer(customer: CustomerData, customers: &mut CustomerDataList) {
        if customer.customer_id == "" || customer.lei == "" {
            msg!("Matching Customer Data Not Found");
        } else {
            let position = customers
                .data
                .iter()
                .position(|index| {
                    index.customer_id == customer.customer_id && index.lei == customer.lei
                })
                .unwrap();
            msg!("Matching Customer Data Found in Position {}", position);
            customers.data[position].kyc_status = customer.kyc_status;
        }
    }
}