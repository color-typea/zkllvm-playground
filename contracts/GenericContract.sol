// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8 <0.9;

import "@nilfoundation/evm-placeholder-verification/contracts/interfaces/modular_verifier.sol";

contract generic_verification_contract {
    struct OracleProof {
        uint256[] public_input;
        bytes zkProof;
    }

    IModularVerifier verifier;

    constructor(address modularVerifier_) {
        verifier = IModularVerifier(modularVerifier_);
    }

    function submitReportData(
        OracleProof calldata proof
    ) public returns (bool) {
        return verifier.verify(
            proof.zkProof,
            proof.public_input
        );
    }
}
