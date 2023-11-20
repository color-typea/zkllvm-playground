// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8 <0.9;

import "@nilfoundation/evm-placeholder-verification/contracts/interfaces/modular_verifier.sol";

contract multiplication_contract {
    struct OracleReport {
        uint256 mul;
    }

    struct OracleProof {
        uint256[] public_input;
        bytes zkProof;
    }

    IModularVerifier verifier;
    address verificationGate;

    constructor(address modularVerifier_) {
        verifier = IModularVerifier(modularVerifier_);
    }

    function submitReportData(
        OracleReport calldata report,
        OracleProof calldata proof
    ) public view returns (bool) {
        return verifyZKLLVMProof(report, proof);
    }

    function verifyZKLLVMProof(
        OracleReport memory report,
        OracleProof memory proof
    ) internal view returns (bool) {
        return verifier.verify(
            proof.zkProof,
            proof.public_input
        );
    }
}
