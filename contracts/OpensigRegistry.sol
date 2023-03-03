// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/**
 * @title Opensig Registry
 * @author Bubble Protocol
 *
 * EVM version of the OpenSig blockchain registry.  Signatures can be registered once.
 */
contract OpensigRegistry {

    /**
     * @dev emitted each time a new published signature is registered.
     */
    event Signature(bytes32 indexed signature, bytes32 data);

    /**
     * @dev registry of published signatures.
     */
    mapping (bytes32 => bool) private signatures;
    
    /**
     * @dev Registers the given signature and emits it along with the given data.
     */
    function registerSignature(bytes32 sig_, bytes32 data_) public {
        require(!signatures[sig_], "signature already published");
        signatures[sig_] = true;
        emit Signature(sig_, data_);
    }
    
}
