#![no_std]

elrond_wasm::imports!();
elrond_wasm::derive_imports!();

use elrond_wasm::types::heap::String;

pub enum MoneyTransferMode {
    TransferToOwner,
    TransferToWinner,
    TransferToWallet
}


#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, TypeAbi)]
pub struct ParticipantInfo {
	name: String,
	age: u8,
	short_description: String,
	photo_lnk: String
}

fn check_participant_name_chars(c : &char) -> bool
{
    if c.is_alphabetic() || c.is_whitespace(){
        return true;
    }
    
    return false;
}

#[elrond_wasm::contract]
pub trait EgldVoting {

    #[view(getEndTime)]
    #[storage_mapper("end_time")]
    fn end_time(&self) -> SingleValueMapper<u64>;
    
    #[view(getRegisteringEndTime)]
    #[storage_mapper("registering_end_time")]
    fn registering_end_time(&self) -> SingleValueMapper<u64>;
    
    #[view(getVotingTax)]
    #[storage_mapper("voting_tax")]
    fn voting_tax(&self) -> SingleValueMapper<BigUint>;
    
    #[view(getRegisteringTax)]
    #[storage_mapper("registering_tax")]
    fn registering_tax(&self) -> SingleValueMapper<BigUint>;
    
    #[view(getMaxAllowedParticipants)]
    #[storage_mapper("max_allowed_participants")]
    fn max_allowed_participants(&self) -> SingleValueMapper<u16>;
    
    #[view(getVoteCount)]
    #[storage_mapper("vote_count")]
    fn vote_count(&self, participant_addr: &ManagedAddress) -> SingleValueMapper<u64>;
    
    #[view(getParticipantInfo)]
    #[storage_mapper("participants")]
    fn participants(&self, participant_addr: &ManagedAddress) -> SingleValueMapper<ParticipantInfo>;
    
    #[view(getParticipantAddrByName)]
    #[storage_mapper("participant_addr_by_name")]
    fn participant_addr_by_name(&self, participant_name: &String) -> SingleValueMapper<ManagedAddress>;
    
    #[view(getParticipants)]
    #[storage_mapper("participant_list")]
    fn participant_list(&self) -> UnorderedSetMapper<ManagedAddress>;
    
    //not really public
    #[storage_mapper("voters_list")]
    fn voters_list(&self) -> UnorderedSetMapper<ManagedByteArray<Self::Api, 32>>;
    
    //not really public
    #[storage_mapper("money_transfer_mode")]
    fn money_transfer_mode(&self) -> SingleValueMapper<u8>;

    //not really public
    #[storage_mapper("receiver_wallet_addr")]
    fn receiver_wallet_addr(&self) -> SingleValueMapper<ManagedAddress>;
    
    #[init]
    fn init(
    	&self, 
    	init_end_time: u64,
    	init_registering_end_time: u64, 
    	init_voting_tax: BigUint, 
    	init_registering_tax: BigUint,
    	init_max_allowed_participants: u16,
    	init_money_transfer_mode: u8, 
    	init_receiver_addr: OptionalValue<ManagedAddress>
    ) {
        self.end_time().set(init_end_time);
        self.registering_end_time().set(init_registering_end_time);
        self.voting_tax().set(init_voting_tax);
        self.registering_tax().set(init_registering_tax);
        self.max_allowed_participants().set(init_max_allowed_participants);
        
        if (init_money_transfer_mode != MoneyTransferMode::TransferToOwner as u8) && (init_money_transfer_mode != MoneyTransferMode::TransferToWinner as u8)
        	&& (init_money_transfer_mode != MoneyTransferMode::TransferToWallet as u8) {
        	sc_panic!("Invalid money transfer mode");
        }
        
        if init_money_transfer_mode == MoneyTransferMode::TransferToWallet as u8 {
        	match init_receiver_addr {
        		OptionalValue::Some(addr) => self.receiver_wallet_addr().set(addr),
        		OptionalValue::None => sc_panic!("No receiving wallet address provided") 
        	}
        }
        
        self.money_transfer_mode().set(init_money_transfer_mode);
    }

    #[endpoint]
    #[payable("EGLD")]
    fn register_participant(
    	&self, participant_name: String,
    	participant_age: u8,
    	participant_desc: String,
    	participant_photo_lnk: String
    	) {
    	if self.blockchain().get_block_timestamp() >= self.registering_end_time().get() {
    		sc_panic!("Registering period ended");
    	}
    
    	let caller_addr = self.blockchain().get_caller();
    	
    	if self.participant_list().contains(&caller_addr){
    		sc_panic!("Participant already registerd (addr_check)");
    	}
    	
    	if !self.participant_addr_by_name(&participant_name).is_empty() {
    		sc_panic!("Participant name already taken (name_check)");
    	}
    	
    	if usize::from(self.max_allowed_participants().get()) < (self.participant_list().len() + 1) {
    		sc_panic!("List of participants is already full");
    	}
    	
    	if self.call_value().egld_value() < self.registering_tax().get() {
    		sc_panic!("You need to pay the registering tax");
    	}
    	
    	if (participant_name.chars().count() > 64 ) || (!participant_name.chars().all(|c| check_participant_name_chars(&c)) ) {
    		sc_panic!("The participant name is not valid");
    	}
        
        let participant = ParticipantInfo {name: participant_name.clone(), age: participant_age, short_description: participant_desc, photo_lnk: participant_photo_lnk};
        //perform insertion
        self.participants(&caller_addr).set(&participant);
        self.participant_addr_by_name(&participant_name).set(&caller_addr);
        self.participant_list().insert(caller_addr);
    }
    
    
    #[endpoint]
    #[payable("EGLD")]
    fn vote_participant(&self, participant_addr: ManagedAddress) {
    	if (self.blockchain().get_block_timestamp() <= self.registering_end_time().get()) && 
    	(usize::from(self.max_allowed_participants().get()) != self.participant_list().len()) {
    		sc_panic!("We are in registering period");
    	}
    	
    	if self.blockchain().get_block_timestamp() >= self.end_time().get() {
    		sc_panic!("Voting period ended");
    	}
    
    	let caller_addr = self.blockchain().get_caller();
    	
    	if !self.participant_list().contains(&participant_addr) {
    		sc_panic!("Participant not existing");
    	}
    	
    	let addr_buff = ManagedBuffer::new_from_bytes(caller_addr.to_address().as_bytes());
    	let voter_addr_h = self.crypto().sha256(&addr_buff);
    	
    	if self.voters_list().contains(&voter_addr_h) {
    		sc_panic!("User already voted");
    	}
    	
    	if self.call_value().egld_value() < self.voting_tax().get() {
    		sc_panic!("You need to pay the voting tax");
    	}
        
        //vote
        self.vote_count(&participant_addr).update(|val| *val += 1);
        
        //insert voter in set
        self.voters_list().insert(voter_addr_h);
    }
    
    #[endpoint]
    #[only_owner]
    fn transfer_funds_after_voting(&self) {
    	if self.blockchain().get_block_timestamp() <= self.end_time().get() {
    		sc_panic!("Voting is still in progress");
    	}
    
    	let mut all_funds = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
    	
    	let max_gas_tax = 10000000u32;
    	
    	if all_funds <= max_gas_tax {
    		sc_panic!("No money or already transfered all money");
    	}
    	
    	all_funds -= max_gas_tax;
    	
        if self.money_transfer_mode().get() == MoneyTransferMode::TransferToOwner as u8 {
        	self.send().direct_egld(&self.blockchain().get_owner_address(),&all_funds);
        }
        
        else if self.money_transfer_mode().get() == MoneyTransferMode::TransferToWinner as u8 {
        	let mut winner_addr = self.blockchain().get_owner_address();
        	let participant_list = self.participant_list(); 
        	let participant_iter = participant_list.iter();
        	let mut max_votes = 0u64;
        	
        	for participant_addr in participant_iter {
        		let current_votes = self.vote_count(&participant_addr).get();
        		if current_votes > max_votes {
        			max_votes = current_votes;
        			winner_addr = participant_addr;
        		}
        	}
        	
        	self.send().direct_egld(&winner_addr,&all_funds);
        }
        else {
        	self.send().direct_egld(&self.receiver_wallet_addr().get(),&all_funds);
        }
        
    }
}
