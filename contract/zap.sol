pragma solidity ^ 0.5.0;

interface CtokenInterface {
    function mint() external payable;
    function transfer(address, uint256) external returns (bool);
    function balanceOf(address owner) external view returns (uint256);
}

contract Zap {
    address cEthAddress = 0xf92FbE0D3C0dcDAE407923b2Ac17eC223b1084E4;
    CtokenInterface cEth = CtokenInterface(cEthAddress);

function deposit() external payable {
    cEth.mint.value(msg.value)();
}
  
struct EIP712Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
  }
  
struct MetaTransaction {
    address holder;
    uint256 nonce;
  }
  
mapping(address => uint256) public nonces;
bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"));
bytes32 internal constant META_TRANSACTION_TYPEHASH = keccak256(bytes("MetaTransaction(address holder,uint256 nonce)"));
bytes32 internal  DOMAIN_SEPARATOR = keccak256(abi.encode(
    EIP712_DOMAIN_TYPEHASH,
    keccak256(bytes("Compound-DApp")),
    keccak256(bytes("1")),
    42, // Kovan
    address(this)
  ));

  // Withdraw with MetaTransaction
function withdraw(address userAddress, uint256 nonce,bytes32 r, bytes32 s, uint8 v) external  {
    bytes32 digest = keccak256(
      abi.encodePacked(
        "\x19\x01",
        DOMAIN_SEPARATOR,
        keccak256(abi.encode(META_TRANSACTION_TYPEHASH,userAddress,nonce))));
        
    require(userAddress != address(0), "invalid-address-0");
    require(userAddress == ecrecover(digest, v, r, s), "invalid-signatures");
    
    uint amount =  cEth.balanceOf(address(this));
    cEth.transfer(userAddress, amount);
    nonces[userAddress]++;
  }
}

