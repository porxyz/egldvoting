<?php

include_once("../functions/php_api/sc_encoding.php");

if(!isset($_POST["pem"]) or strlen($_POST["pem"]) > 10000)
{
	die(json_encode(array("status" => "error")));
}

$pem = $_POST["pem"];

if(extract_addr_from_pem($pem) < 0 or extract_priv_key_from_pem($pem) < 0)
{
	die(json_encode(array("status" => "invalid_pem")));
}

$raw_key = bech32_decode("erd",extract_addr_from_pem($pem));

echo(json_encode(array("status" => "success", "hex_key" => bin2hex($raw_key) )));
?>
