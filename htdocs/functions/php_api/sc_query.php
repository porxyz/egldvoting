<?php

function querySCdata($SC_addr_bech32, $func_name, $func_args = array())
{
	$elrond_API_data = array("scAddress" => $SC_addr_bech32, "funcName" => $func_name, "args" => $func_args);
 
	$payload = json_encode($elrond_API_data);

	$ch = curl_init("https://devnet-gateway.elrond.com/vm-values/query");

	curl_setopt( $ch, CURLOPT_POSTFIELDS, $payload );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true);

	$result = curl_exec($ch);

	$server_response = json_decode($result);

	if($server_response == NULL)
		return -1;
	
	if(!property_exists($server_response,"data") || !property_exists($server_response,"code") || $server_response->code != "successful")
		return -2;

	if(!property_exists($server_response->data,"data") || !property_exists($server_response->data->data,"returnData"))
		return -3;

	$response_data = $server_response->data->data->returnData;

	return $response_data;
}


?>
