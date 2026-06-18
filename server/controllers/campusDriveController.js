const CampusDrive = require('../models/CampusDrive');
const UserDriveParticipation = require('../models/UserDriveParticipation');
const User = require('../models/User');

// @desc    Get all campus drives with user eligibility and participation status
// @route   GET /api/campus-drives
// @access  Private
const getCampusDrives = async (req, res) => {
  try {
    const drives = await CampusDrive.find().sort({ visitDate: 1 });
    const user = await User.findById(req.user._id);
    const participations = await UserDriveParticipation.find({ userId: req.user._id });

    const drivesWithStatus = drives.map(drive => {
      // Find if user is already participating
      const participation = participations.find(p => p.driveId.toString() === drive._id.toString());
      
      // Calculate eligibility if no participation record yet
      let isEligible = true;
      let ineligibilityReason = '';

      if (!participation) {
        if (drive.eligibility.minCGPA > 0 && (user.cgpa || 0) < drive.eligibility.minCGPA) {
          isEligible = false;
          ineligibilityReason = 'CGPA cutoff not met';
        } else if (drive.eligibility.allowedBranches.length > 0 && !drive.eligibility.allowedBranches.includes(user.branch)) {
          isEligible = false;
          ineligibilityReason = 'Branch not allowed';
        } else if (drive.eligibility.maxActiveBacklogs >= 0 && (user.activeBacklogs || 0) > drive.eligibility.maxActiveBacklogs) {
          isEligible = false;
          ineligibilityReason = 'Active backlogs exceed limit';
        } else if (drive.eligibility.allowedGradYears.length > 0 && !drive.eligibility.allowedGradYears.includes(user.gradYear)) {
          isEligible = false;
          ineligibilityReason = 'Graduation year not allowed';
        }
      }

      return {
        ...drive.toObject(),
        participationStatus: participation ? participation.status : (isEligible ? 'Eligible' : 'Not Eligible'),
        ineligibilityReason: participation ? '' : ineligibilityReason,
        participationId: participation ? participation._id : null
      };
    });

    res.status(200).json(drivesWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch campus drives' });
  }
};

// @desc    Register for a campus drive
// @route   POST /api/campus-drives/:id/register
// @access  Private
const registerForDrive = async (req, res) => {
  try {
    const driveId = req.params.id;
    const drive = await CampusDrive.findById(driveId);
    
    if (!drive) {
      return res.status(404).json({ message: 'Drive not found' });
    }

    if (new Date() > new Date(drive.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if already registered
    let participation = await UserDriveParticipation.findOne({ userId: req.user._id, driveId });
    if (participation) {
      return res.status(400).json({ message: 'Already registered for this drive' });
    }

    participation = await UserDriveParticipation.create({
      userId: req.user._id,
      driveId: drive._id,
      status: 'Registered'
    });

    res.status(201).json(participation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to register for drive' });
  }
};

// @desc    Update participation status (e.g. Cleared round)
// @route   PUT /api/campus-drives/participation/:id
// @access  Private
const updateParticipationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const participation = await UserDriveParticipation.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status, notes },
      { new: true }
    );
    if (!participation) {
      return res.status(404).json({ message: 'Participation record not found' });
    }
    res.status(200).json(participation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status' });
  }
};

// @desc    Admin: Create a new campus drive
// @route   POST /api/campus-drives
// @access  Private (Should ideally be Admin only)
const createCampusDrive = async (req, res) => {
  try {
    const drive = await CampusDrive.create(req.body);
    res.status(201).json(drive);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create campus drive' });
  }
};

module.exports = {
  getCampusDrives,
  registerForDrive,
  updateParticipationStatus,
  createCampusDrive
};
