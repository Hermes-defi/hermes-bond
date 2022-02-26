// SPDX-License-Identifier: MIT
pragma solidity ^0.7.5;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import './AddrArrayLib.sol';

interface IToken {
    function mint(address _to, uint256 _amount) external;
    function transfer(address _to, uint256 _amount) external returns(bool);
    function balanceOf(address) external returns(uint256);
}

contract MasterChef is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using AddrArrayLib for AddrArrayLib.Addresses;
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastDepositTime;
        uint256 rewardLockedUp;
        uint256 nextHarvestUntil;
    }

    struct PoolInfo {
        IERC20 lpToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accTokenPerShare;
        uint16 taxWithdraw;
        uint256 withdrawLockPeriod;
        uint256 rewardLockPeriod;
        uint16 depositFee;
        uint16 harvestFee;
    }

    IToken public immutable token;
    address payable public devaddr;
    uint16 public devFee = 1000;
    uint256 totalLockedUpRewards;

    uint256 public tokenPerBlock;
    uint256 public bonusMultiplier = 1;

    PoolInfo[] public poolInfo;
    uint256[] public poolsList;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    mapping(uint256 => AddrArrayLib.Addresses) private addressByPid;
    mapping(uint256 => uint[]) public userPoolByPid;

    mapping(uint256 => uint256) public deposits;
    uint256 public totalAllocPoint = 0;
    uint256 public startBlock;

    mapping(address => bool) public poolExists;

    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event DepositWithFee(address indexed user, uint256 indexed pid, uint256 amount, uint256 received);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event WithdrawWithTax(address indexed user, uint256 indexed pid, uint256 sent, uint256 burned);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Transfer(address indexed to, uint256 requsted, uint256 sent);
    event TokenPerBlockUpdated(uint256 tokenPerBlock);
    event UpdateEmissionSettings(address indexed from, uint256 depositAmount, uint256 endBlock);
    event UpdateMultiplier(uint256 multiplierNumber);
    event SetDev(address indexed prevDev, address indexed newDev);
    event SetTaxAddr(address indexed prevAddr, address indexed newAddr);
    event SetReserveAddr(address indexed prevAddr, address indexed newAddr);
    event SetAuthorizedCaller(address indexed caller, bool _status);
    modifier validatePoolByPid(uint256 _pid) {
        require(_pid < poolInfo.length, "pool id not exisit");
        _;
    }

    constructor(
        address _token,
        uint256 _tokenPerBlock,
        uint256 _startBlock
    ) public {
        token = IToken(_token);
        devaddr = payable(msg.sender);
        tokenPerBlock = _tokenPerBlock;
        startBlock = _startBlock;
    }

    function updateTokenPerBlock(uint256 _tokenPerBlock) external onlyOwner {
        tokenPerBlock = _tokenPerBlock;
        emit TokenPerBlockUpdated(_tokenPerBlock);
    }

    function updateMultiplier(uint256 multiplierNumber) external onlyOwner {
        bonusMultiplier = multiplierNumber;
        emit UpdateMultiplier(multiplierNumber);
    }

    function poolLength() external view returns (uint256) {
        return poolInfo.length;
    }

    function addPool(
        uint256 _allocPoint,
        address _lpToken,
        uint16 _taxWithdraw,
        uint256 _withdrawLockPeriod,
        uint256 _rewardLockPeriod,
        uint16 _depositFee,
        bool _withUpdate,
        uint16 _harvestFee
    ) external onlyOwner {
        require(_depositFee <= 1000, "err1");
        require(_taxWithdraw <= 1000, "err2");
        require(_withdrawLockPeriod <= 240 days, "err4");
        require(poolExists[_lpToken] == false, "err5");

        IERC20(_lpToken).balanceOf(address(this));

        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastRewardBlock =
        block.number > startBlock ? block.number : startBlock;

        totalAllocPoint = totalAllocPoint.add(_allocPoint);
        poolInfo.push(
            PoolInfo(
            {
            lpToken : IERC20(_lpToken),
            allocPoint : _allocPoint,
            lastRewardBlock : lastRewardBlock,
            accTokenPerShare : 0,
            taxWithdraw : _taxWithdraw,
            withdrawLockPeriod : _withdrawLockPeriod,
            rewardLockPeriod : _rewardLockPeriod,
            depositFee : _depositFee,
            harvestFee : _harvestFee
            })
        );
        poolsList.push(poolInfo.length);
    }

    function setupLocks(uint256 _pid,
        uint16 _taxWithdraw,
        uint256 _withdrawLockPeriod,
        uint256 _rewardLockPeriod,
        uint16 _depositFee,
        uint16 _harvestFee) external onlyOwner validatePoolByPid(_pid) {
        require(_depositFee <= 1000, "err1");
        require(_taxWithdraw <= 1000, "err2");
        require(_withdrawLockPeriod <= 240 days, "err4");
        poolInfo[_pid].taxWithdraw = _taxWithdraw;
        poolInfo[_pid].withdrawLockPeriod = _withdrawLockPeriod;
        poolInfo[_pid].rewardLockPeriod = _rewardLockPeriod;
        poolInfo[_pid].depositFee = _depositFee;
        poolInfo[_pid].harvestFee = _harvestFee;
    }

    function changePoolAllocation(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner validatePoolByPid(_pid) {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 prevAllocPoint = poolInfo[_pid].allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        if (prevAllocPoint != _allocPoint) {
            totalAllocPoint = totalAllocPoint.sub(prevAllocPoint).add(_allocPoint);
        }
    }

    function getMultiplier(uint256 _from, uint256 _to)
    public
    view
    returns (uint256)
    {
        return _to.sub(_from).mul(bonusMultiplier);
    }

    function pendingReward(uint256 _pid, address _user)
    public
    view
    validatePoolByPid(_pid)
    returns (uint256)
    {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        uint256 accTokenPerShare = pool.accTokenPerShare;
        uint256 lpSupply = deposits[_pid];
        uint256 tokenPendingReward;
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 tokenReward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accTokenPerShare = accTokenPerShare.add(tokenReward.mul(1e12).div(lpSupply));
        }
        tokenPendingReward = user.amount.mul(accTokenPerShare).div(1e12).sub(user.rewardDebt);
        return tokenPendingReward.add(user.rewardLockedUp);
    }

    function massUpdatePools() public {
        uint256 length = poolInfo.length;
        for (uint256 pid = 0; pid < length; ++pid) {
            updatePool(pid);
        }

    }

    function updatePool(uint256 _pid) public validatePoolByPid(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = deposits[_pid];
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 tokenReward = multiplier.mul(tokenPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        uint256 fee = tokenReward.mul(devFee).div(10000);
        token.mint(devaddr, fee);
        token.mint(address(this), tokenReward);
        pool.accTokenPerShare = pool.accTokenPerShare.add(tokenReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    function deposit(uint256 _pid, uint256 _amount) external {
        depositFor(msg.sender, _pid, _amount);
    }

    function depositFor(address recipient, uint256 _pid, uint256 _amount)
    public validatePoolByPid(_pid) nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][recipient];
        updatePool(_pid);
        _payRewardByPid(_pid, recipient);
        if (_amount > 0) {
            if (pool.depositFee > 0) {
                uint256 tax = _amount.mul(pool.depositFee).div(10000);
                uint256 received = _amount.sub(tax);
                pool.lpToken.safeTransferFrom(address(msg.sender), devaddr, tax);
                uint256 oldBalance = pool.lpToken.balanceOf(address(this));
                pool.lpToken.safeTransferFrom(address(msg.sender), address(this), received);
                uint256 newBalance = pool.lpToken.balanceOf(address(this));
                received = newBalance.sub(oldBalance);
                deposits[_pid] = deposits[_pid].add(received);
                user.amount = user.amount.add(received);
                userPool(_pid, recipient);
                emit DepositWithFee(recipient, _pid, _amount, received);
            } else {
                uint256 oldBalance = pool.lpToken.balanceOf(address(this));
                pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
                uint256 newBalance = pool.lpToken.balanceOf(address(this));
                _amount = newBalance.sub(oldBalance);
                deposits[_pid] = deposits[_pid].add(_amount);
                user.amount = user.amount.add(_amount);
                userPool(_pid, recipient);
                emit Deposit(recipient, _pid, _amount);
            }
            user.lastDepositTime = block.timestamp;
            if (user.nextHarvestUntil == 0 && pool.rewardLockPeriod > 0) {
                user.nextHarvestUntil = block.timestamp.add(pool.rewardLockPeriod);
            }
        }
        user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);

    }


    event withdrawTax(uint256 tax);

    function withdraw(uint256 _pid, uint256 _amount) external validatePoolByPid(_pid)
    nonReentrant  {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");
        updatePool(_pid);
        _payRewardByPid(_pid, msg.sender);
        if (_amount > 0) {
            if (pool.withdrawLockPeriod > 0) {
                require(block.timestamp > user.lastDepositTime + pool.withdrawLockPeriod,
                    "withdraw still locked");
            }
            if (pool.taxWithdraw > 0) {
                uint256 tax = _amount.mul(pool.taxWithdraw).div(10000);
                if (tax > 0) {
                    deposits[_pid] = deposits[_pid].sub(tax);
                    user.amount = user.amount.sub(tax);
                    _amount = _amount.sub(tax);
                    pool.lpToken.safeTransfer(devaddr, tax);
                    emit withdrawTax(tax);
                }
            }
            _withdraw(_pid, _amount);
        }
    }

    function _withdraw(uint256 _pid, uint256 _amount) internal {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        deposits[_pid] = deposits[_pid].sub(_amount);
        user.amount = user.amount.sub(_amount);
        pool.lpToken.safeTransfer(address(msg.sender), _amount);
        emit Withdraw(msg.sender, _pid, _amount);
        user.rewardDebt = user.amount.mul(pool.accTokenPerShare).div(1e12);
    }

    function emergencyWithdraw(uint256 _pid) external validatePoolByPid(_pid) nonReentrant {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        deposits[_pid] = deposits[_pid].sub(user.amount);
        pool.lpToken.safeTransfer(address(msg.sender), user.amount);
        emit EmergencyWithdraw(msg.sender, _pid, user.amount);
        deposits[_pid] = deposits[_pid].sub(user.amount);
        user.amount = 0;
        user.rewardDebt = 0;
        userPool(_pid, msg.sender);
    }

    function setMultiplier(uint256 val) external onlyOwner {
        bonusMultiplier = val;
    }

    function dev(address payable _devaddr) external onlyOwner {
        emit SetDev(devaddr, _devaddr);
        devaddr = _devaddr;
    }

    function setDevFee(uint16 val) external onlyOwner {
        devFee = val;
    }

    function getTotalPoolUsers(uint256 _pid) external virtual view returns (uint256) {
        return addressByPid[_pid].getAllAddresses().length;
    }

    function getAllPoolUsers(uint256 _pid) public virtual view returns (address[] memory) {
        return addressByPid[_pid].getAllAddresses();
    }

    function userPoolBalances(uint256 _pid) external virtual view returns (UserInfo[] memory) {
        address[] memory list = getAllPoolUsers(_pid);
        UserInfo[] memory balances = new UserInfo[](list.length);
        for (uint i = 0; i < list.length; i++) {
            address addr = list[i];
            balances[i] = userInfo[_pid][addr];
        }
        return balances;
    }

    function userPool(uint256 _pid, address _user) internal {
        AddrArrayLib.Addresses storage addresses = addressByPid[_pid];
        uint256 amount = userInfo[_pid][_user].amount;
        if (amount > 0) {
            addresses.pushAddress(_user);
        } else if (amount == 0) {
            addresses.removeAddress(_user);
        }
    }

    function canHarvest(uint256 pid, address recipient) public view returns (bool){
        UserInfo storage user = userInfo[pid][recipient];
        return block.timestamp >= user.nextHarvestUntil;
    }

    function _payRewardByPid(uint256 pid, address recipient) public {
        PoolInfo storage pool = poolInfo[pid];
        UserInfo storage user = userInfo[pid][recipient];
        uint256 pending = user.amount.mul(pool.accTokenPerShare).div(1e12).sub(user.rewardDebt);
        if (canHarvest(pid, recipient)) {
            uint256 totalRewards = pending.add(user.rewardLockedUp);
            if (totalRewards > 0) {
                uint256 fee = 0;
                if (pool.harvestFee > 0) {
                    fee = totalRewards.mul(pool.harvestFee).div(10000);
                    safeTokenTransfer(devaddr, fee);
                }
                safeTokenTransfer(recipient, totalRewards.sub(fee));
                totalLockedUpRewards = totalLockedUpRewards.sub(user.rewardLockedUp);
                user.rewardLockedUp = 0;
                user.nextHarvestUntil = block.timestamp.add(pool.rewardLockPeriod);
            }
        } else {
            user.rewardLockedUp = user.rewardLockedUp.add(pending);
            totalLockedUpRewards = totalLockedUpRewards.add(pending);
        }
    }
    function safeTokenTransfer(address _to, uint256 _amount) internal {
        uint256 balance = token.balanceOf(address(this));
        bool transferSuccess = false;
        if (_amount > balance) {
            transferSuccess = token.transfer(_to, balance);
        } else {
            transferSuccess = token.transfer(_to, _amount);
        }
        emit Transfer(_to, _amount, balance);
        require(transferSuccess, "SAFE TOKEN TRANSFER FAILED");
    }


}
