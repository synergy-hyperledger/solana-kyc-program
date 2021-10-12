use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum KYCError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
}

impl From<KYCError> for ProgramError {
    fn from(e: KYCError) -> Self {
        ProgramError::Custom(e as u32)
    }
}