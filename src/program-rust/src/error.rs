use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum CustomerDataError {
    #[error("Invalid Instruction")]
    InvalidInstruction,

    #[error("Missing Customer ID")]
    MissingCustomerId,

    #[error("Invalid Customer ID")]
    InvalidCustomerId,
}

impl From<CustomerDataError> for ProgramError {
    fn from(e: CustomerDataError) -> Self {
        ProgramError::Custom(e as u32)
    }
}