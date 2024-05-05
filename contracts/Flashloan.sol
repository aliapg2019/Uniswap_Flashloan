pragma solidity 0.8.17;

import "hardhat/console.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
// import "./interfaces/ISwapRouter.sol";
// import "@uniswap/v3-core/contracts/interfaces/callback/IUniswapV3Pool.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV3Pool.sol";
import "./libraries/PoolAddress.sol";

contract Flashloan {
    address private constant FACTORY =
        0x1F98431c8aD98523631AE4a59f267346ea31F984;

    address public constant routerAddress =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;

    struct FlashCallbackData {
        uint256 amount0;
        uint256 amount1;
        address caller;
    }

    address public constant LINK = 
    // 0xb0897686c545045aFc77CF20eC7A532E3120E0F1;
    0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address public constant USDC = 
    // 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public constant WETH = 
    // 0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619;
    0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address[] tokens;
    uint24[] fees;

    IERC20 private immutable token0;
    IERC20 private immutable token1;
    IERC20 public linkToken = IERC20(LINK);
    IERC20 public usdcToken = IERC20(USDC);
    IERC20 private immutable usdt = IERC20(USDT);

    uint24 public constant poolFee = 3000;

    IUniswapV3Pool private immutable pool;
    ISwapRouter public immutable swapRouter = ISwapRouter(routerAddress);

    constructor(address _token0, address _token1, uint24 _fee) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
        pool = IUniswapV3Pool(getPool(_token0, _token1, _fee));
    }

    function getPool(
        address _token0,
        address _token1,
        uint24 _fee
    ) public pure returns (address) {
        PoolAddress.PoolKey memory poolKey = PoolAddress.getPoolKey(
            _token0,
            _token1,
            _fee
        );
        return PoolAddress.computeAddress(FACTORY, poolKey);
    }

    function flash(uint256 amount0, uint256 amount1) external {
        bytes memory data = abi.encode(
            FlashCallbackData({
                amount0: amount0,
                amount1: amount1,
                caller: msg.sender
            })
        );

        IUniswapV3Pool(pool).flash(address(this), amount0, amount1, data);
    }

    function uniswapV3FlashCallback(
        uint256 fee0,
        uint256 fee1,
        bytes calldata data
    ) external {
        require(msg.sender == address(pool), "not authorized");

        FlashCallbackData memory decoded = abi.decode(
            data,
            (FlashCallbackData)
        );

        // Do your abitrage below...
        console.log(token0.balanceOf(address(this)));
        console.log(token1.balanceOf(address(this)));
        // swapExactInputSingle(token0.balanceOf(address(this)));
        arbitage(tokens, fees, 1 ether);
        console.log(token0.balanceOf(address(this)));
        console.log(token1.balanceOf(address(this)));

        // Repay borrow
        // if (fee0 > 0) {
        //     token0.transferFrom(decoded.caller, address(this), fee0);
        //     token0.transfer(address(pool), decoded.amount0 + fee0);
        // }
        // if (fee1 > 0) {
        //     token1.transferFrom(decoded.caller, address(this), fee1);
        //     token1.transfer(address(pool), decoded.amount1 + fee1);
        // }

        if (fee0 > 0) {
            require(
                token0.balanceOf(address(this)) >= fee0,
                "Insufficient token0 balance"
            );
            require(
                token0.allowance(decoded.caller, address(this)) >= fee0,
                "Not enough token0 allowance"
            );
            token0.transferFrom(decoded.caller, address(this), fee0);
            token0.transfer(address(pool), decoded.amount0 + fee0);
        }
        console.log("$$", decoded.amount1 , fee1);
        if (fee1 > 0) {
            require(
                token1.balanceOf(address(this)) >= fee1,
                "Insufficient token1 balance"
            );
            require(
                token1.allowance(decoded.caller, address(this)) >= fee1,
                "Not enough token1 allowance"
            );
            token1.transferFrom(decoded.caller, address(this), fee1);
            token1.transfer(address(pool), decoded.amount1 + fee1);
        }
    }

    function swapExactInputSingle(
        uint256 amountIn,
        address fromToken,
        address toToken,
        uint24 _poolFee
    ) public payable returns (uint256 amountOut) {
        // linkToken.approve(address(swapRouter), amountIn);
        IERC20(fromToken).approve(address(swapRouter), amountIn);
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: fromToken,
                tokenOut: toToken,
                fee: _poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        amountOut = swapRouter.exactInputSingle(params);
        // usdcToken.transferFrom(address(this) , msg.sender , usdcToken.balanceOf(address(this)));
        console.log("amoutOut:", amountOut);
        return (amountOut);
    }

    function arbitage(
        address[] memory _tokens,
        uint24[] memory _fees,
        uint256 _amountIn
    ) public {
        uint256 swap1 = swapExactInputSingle(
            _amountIn,
            _tokens[0],
            _tokens[1],
            _fees[0]
        );
        uint256 swap2 = swapExactInputSingle(
            swap1,
            _tokens[1],
            _tokens[2],
            _fees[1]
        );
        uint256 swap3 = swapExactInputSingle(
            swap2,
            _tokens[2],
            _tokens[0],
            _fees[2]
        );

        console.log("This is swap:", swap3);
        if (swap3 > _amountIn) {
            uint256 percent = (swap3 / _amountIn) * 100 - 100;
            console.log("This is profit =>", percent);
        }
    }

    function getPairs(
        address[3] memory _tokens,
        uint24[3] memory _fees
    ) public {
        // for (uint i = 0; i < _tokens.length; i++) {
        tokens = [_tokens[0], _tokens[1], _tokens[2]];
        fees = [_fees[0], _fees[1], _fees[2]];
        // }
        console.log(tokens[0], tokens[1], tokens[2]);
        console.log(fees[0], fees[1], fees[2]);
        console.log(msg.sender);
    }
}
