// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8 <0.9;

import "./CircuitParams.sol";
import "@nilfoundation/evm-placeholder-verification/contracts/interfaces/verifier.sol";

contract VerificationContract {
    struct OracleReport {
        uint256 sum;
    }

    struct OracleProof {
        uint256[] public_input;
        bytes zkProof;
    }

    event ReportAccepted(OracleReport report);
    event ReportRejected(OracleReport report, string reason);

    IVerifier zkllvmVerifier;
    address verificationGate;

    constructor(address zkllvmVerifier_, address verificationGate_) {
        zkllvmVerifier = IVerifier(zkllvmVerifier_);
        verificationGate = verificationGate_;
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
        uint256[] memory init_params = CircuitParams.get_init_params();
        int256[][] memory columns_rotations = CircuitParams.get_column_rotations();
        return
            zkllvmVerifier.verify(
                proof.zkProof,
                init_params,
                columns_rotations,
                proof.public_input,
                verificationGate
            );
    }
}
