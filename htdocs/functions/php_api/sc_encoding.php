<?php

include_once("bech32_formatter.php");

function decode_elrond_data($data,$format)
{
	$raw_data = base64_decode($data);
	if($raw_data === false)
		return false;
	
	//warning: PHP treats integers as signed, so a big enough u64 could overflow
	//consider reading u64 as bignum
	if($format == "u8" || $format == "u16" || $format == "u32" || $format == "u64")
	{
		$result = 0;
		
		for($i=0; $i<strlen($raw_data); $i++)
		{
			$result = ($result << 8) + ord($raw_data[$i]);
		}
		
		return $result;
	}
	
	else if($format == "bignum")
	{
		$result = 0;
		
		for($i=0; $i<strlen($raw_data); $i++)
		{
			$result = bcadd(bcmul($result,256),ord($raw_data[$i]));
		}
		
		return $result;
	}
	
	else if($format == "bech32")
	{
		$result = "";
		try
		{
			$result = bech32_encode("erd",$raw_data);
		}
		catch(Exception $e)
		{
			return false;
		}
		
		return $result;
		
	}
	
	else if($format == "string")
	{
		if(strlen($raw_data) < 4)
			return false;
			
		$len = decode_elrond_data(base64_encode(substr($raw_data,0,4)),"u32");
		
		if(strlen($raw_data) < 4 + $len)
			return false;
		
		return substr($raw_data,4,$len);
		
	}
	
	else if($format == "participant_info")
	{
		$result = array();
		
		$name =  decode_elrond_data($data,"string");
		if($name === false)
			return false;
			
		$result["name"] = $name;
		$str_offset = 4 + strlen($name);
		
		if(strlen($raw_data) < $str_offset + 1)
			return false;
			
		$result["age"] = decode_elrond_data(base64_encode(substr($raw_data,$str_offset,1)),"u8");
		$str_offset++;
		
		if(strlen($raw_data) < $str_offset + 4)
			return false;
			
		$desc = decode_elrond_data(base64_encode(substr($raw_data,$str_offset)),"string");
		if($desc === false)
			return false;
			
		$result["short_description"] = $desc;
		$str_offset += 4 + strlen($desc);
		
		if(strlen($raw_data) < $str_offset + 4)
			return false;
			
		$photo_url = decode_elrond_data(base64_encode(substr($raw_data,$str_offset)),"string");
		if($photo_url === false)
			return false;
			
		$result["photo_url"] = $photo_url;
		
		return $result;
	}	
	
	else
		return $raw_data;
}

function extract_addr_from_pem($pem)
{
	$start_token = strpos($pem,"for erd1");
	if($start_token === false)
		return -1;
		
	$start_token += strlen("for ");
	
	$stop_token = strpos($pem,"-----",$start_token);
	if($stop_token === false)
		return -2;
		
	if($stop_token - $start_token != 62)
		return -3;
		
	return substr($pem,$start_token,$stop_token - $start_token);
}

function extract_priv_key_from_pem($pem)
{
	$start_token = strpos($pem,"\n");
	if($start_token === false)
		return -1;
		
	$start_token++;
	
	$stop_token = strpos($pem,"-----",$start_token);
	if($stop_token === false)
		return -2;
		
	$b64_enc_key = str_replace(array("\n", "\r"), '',substr($pem,$start_token,$stop_token - $start_token));
	
	$hex_enc_key = base64_decode($b64_enc_key);
	if($hex_enc_key === false)
		return -3;
		
	$raw_key = hex2bin($hex_enc_key);
	if($raw_key == false)
		return -4;
		
	return $raw_key;
}

?>
