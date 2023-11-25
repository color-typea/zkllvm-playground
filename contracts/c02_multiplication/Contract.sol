// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8 <0.9;

import "@nilfoundation/evm-placeholder-verification/contracts/interfaces/modular_verifier.sol";

contract multiplication_contract {
    struct Proof {
        uint256[] public_input;
        bytes zkProof;
    }

    IModularVerifier verifier;
    address verificationGate;

    constructor(address modularVerifier_) {
        verifier = IModularVerifier(modularVerifier_);
    }

    function submitReportData(
        Proof calldata proof
    ) public view returns (bool) {
        return verifyZKLLVMProof(proof);
    }

    function verifyZKLLVMProof(
        Proof memory proof
    ) internal view returns (bool) {
        return verifier.verify(
            proof.zkProof,
            proof.public_input
        );
    }
}
