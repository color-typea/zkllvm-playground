// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.9;

library CircuitParams {
    uint256 constant modulus = 28948022309329048855892746252171976963363056481941560715954676764349967630337;
    uint256 constant r = 4;
    uint256 constant maxDegree = 31;
    uint256 constant lambda = 2;

    uint256 constant rowsAmount = 32;
    uint256 constant omega = 3612152772817685532768635636100598085437510685224817206515049967552954106764;

    function getDOmegas()
    internal pure returns (uint256[4] memory DOmegas) {
        DOmegas = [
            uint256(3612152772817685532768635636100598085437510685224817206515049967552954106764), 
            uint256(14450201850503471296781915119640920297985789873634237091629829669980153907901), 
            uint256(199455130043951077247265858823823987229570523056509026484192158816218200659), 
            uint256(24760239192664116622385963963284001971067308018068707868888628426778644166363)
        ];
    }

    function getStepList()
    internal pure returns (uint256[4] memory stepList) {
        stepList = [
            uint256(1), 
            uint256(1), 
            uint256(1), 
            uint256(1)
        ];
    }

    function getArithmetizationParams()
    internal pure returns (uint256[4] memory arithmetizationParams) {
        arithmetizationParams = [
            uint256(15), 
            uint256(1), 
            uint256(5), 
            uint256(15)
        ];
    }

    function getInitParams()
    internal pure returns (uint256[] memory initArgs) {
        uint256[4] memory dOmegas = getDOmegas();
        uint256[4] memory stepList = getStepList();
        uint256[4] memory arithmetizationParams = getArithmetizationParams();

        initArgs = new uint256[](
            6 // static fields: modulus to omega
            + (1 + dOmegas.length) // D_omegas.length + D_omegas
            + (1 + stepList.length) // step_list.length + step_list
            + (1 + arithmetizationParams.length) // arithmetization_params.length + arithmetization_params
        );

        uint curIndex = 0;

        initArgs[curIndex++] = modulus;
        initArgs[curIndex++] = r;
        initArgs[curIndex++] = maxDegree;
        initArgs[curIndex++] = lambda;
        initArgs[curIndex++] = rowsAmount;
        initArgs[curIndex++] = omega;

        // Append D_omegas and length
        initArgs[curIndex++] = dOmegas.length;
        for (uint idx = 0; idx < dOmegas.length; idx++) {
            initArgs[curIndex++] = dOmegas[idx];
        }

        // Append step_list and length
        initArgs[curIndex++] = stepList.length;
        for (uint idx = 0; idx < stepList.length; idx++) {
            initArgs[curIndex++] = stepList[idx];
        }

        // Append arithmetization_params and length
        initArgs[curIndex++] = arithmetizationParams.length;
        for (uint idx = 0; idx < arithmetizationParams.length; idx++) {
            initArgs[curIndex++] = arithmetizationParams[idx];
        }
    }


    function dynArray1(
        int256 value0
    ) internal pure returns (int256[] memory result) {
        result = new int256[](1);
        result[0] = value0;
    }


    function getColumnRotations()
    internal pure returns (int256[][] memory) {
        int256[][] memory column_rotations = new int256[][](56);
        uint idx = 0;
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        column_rotations[idx++] = dynArray1(0);
        return column_rotations;
    }
}