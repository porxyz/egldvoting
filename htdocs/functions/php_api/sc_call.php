<?php

include_once("sc_encoding.php");

function getWalletNonce($wallet_addr)
{
	$ch = curl_init("https://devnet-gateway.elrond.com/transaction/pool?by-sender=".$wallet_addr."&last-nonce=true");
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true);

	$result = curl_exec($ch);

	$server_response = json_decode($result);
	
	if($server_response != NULL and property_exists($server_response,"data") and property_exists($server_response,"code")
		and $server_response->code == "successful" and property_exists($server_response->data,"nonce")) 
	{
		return $server_response->data->nonce + 1;
	}
	
	curl_close($ch);
	$ch = curl_init("https://devnet-gateway.elrond.com/address/".$wallet_addr."/nonce");
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true);

	$result = curl_exec($ch);

	$server_response = json_decode($result);
	
	if($server_response == NULL)
		return -3;
	
	if(!property_exists($server_response,"data") || !property_exists($server_response,"code") || $server_response->code != "successful")
		return -4;

	if(!property_exists($server_response->data,"nonce"))
		return -5;
		
	return $server_response->data->nonce;
}

function callSCfunction($SC_addr_bech32, $value, $pem, $func_name, $func_args = array())
{
	$sender_addr = extract_addr_from_pem($pem);
	if($sender_addr < 0)
		return -1;
	
	$sender_priv_key = extract_priv_key_from_pem($pem);
	if($sender_priv_key < 0)
		return -2;

	$nonce = getWalletNonce($sender_addr);
	if($nonce < 0)
		return -3;
	
	$call_data = $func_name;
	
	for($i = 0; $i<count($func_args); $i++)
	{
		$call_data.= "@" . $func_args[$i];
	}
	
	$elrond_API_data = array(
		"nonce" => $nonce,
		"value" => strval($value),
		"receiver" => $SC_addr_bech32,
		"sender" => $sender_addr,
		"gasPrice" => 1000000000,
		"gasLimit" => 10000000,
		"data" => base64_encode($call_data),
		"chainID" => "D",
		"version" => 1);
 
	$unsigned_payload = json_encode($elrond_API_data);
	$tx_signature = bin2hex(sodium_crypto_sign_detached($unsigned_payload,$sender_priv_key));
	
	$elrond_API_data["signature"] = $tx_signature;
	$signed_payload = json_encode($elrond_API_data);
	
	$ch = curl_init("https://devnet-gateway.elrond.com/transaction/send");

	curl_setopt( $ch, CURLOPT_POSTFIELDS, $signed_payload );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true);

	$result = curl_exec($ch);

	$server_response = json_decode($result);

	if($server_response == NULL)
		return -1;
	
	if(!property_exists($server_response,"data") || !property_exists($server_response,"code") || $server_response->code != "successful")
		return -2;

	if(!property_exists($server_response->data,"txHash"))
		return -3;

	return $server_response->data->txHash;
}

?>
