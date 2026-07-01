const Network = require('../models/Network');

// @desc    Get all network contacts
// @route   GET /api/network
// @access  Private
const getContacts = async (req, res) => {
  try {
    const contacts = await Network.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const addContact = async (req, res) => {
  try {
    const { name, company, role, platform, status, lastContactDate, notes, followUpDate, linkedApplication } = req.body;
    
    const contact = new Network({
      userId: req.user.id,
      name,
      company,
      role,
      platform,
      status,
      lastContactDate,
      notes,
      followUpDate,
      linkedApplication
    });

    const savedContact = await contact.save();
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateContact = async (req, res) => {
  try {
    const contact = await Network.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const updatedContact = await Network.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteContact = async (req, res) => {
  try {
    const contact = await Network.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    if (contact.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await contact.deleteOne();
    res.json({ message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNetworkGraph = async (req, res) => {
  try {
    const contacts = await Network.find({ userId: req.user.id }).populate('linkedApplication', 'company role status');
    
    const nodes = [];
    const edges = [];
    let nodeId = 1;

    const companyNodesMap = {};
    const appNodesMap = {};

    contacts.forEach(contact => {
      // Create contact node
      const contactNodeId = `contact-${contact._id}`;
      nodes.push({ id: contactNodeId, label: contact.name, group: 'contact', title: contact.role });

      // Create company node if it doesn't exist
      if (contact.company) {
        if (!companyNodesMap[contact.company]) {
          const compNodeId = `company-${contact.company}`;
          companyNodesMap[contact.company] = compNodeId;
          nodes.push({ id: compNodeId, label: contact.company, group: 'company' });
        }
        edges.push({ from: contactNodeId, to: companyNodesMap[contact.company] });
      }

      // If linked application exists, link contact or company to application
      if (contact.linkedApplication) {
        const app = contact.linkedApplication;
        if (!appNodesMap[app._id]) {
          const appNodeId = `app-${app._id}`;
          appNodesMap[app._id] = appNodeId;
          nodes.push({ id: appNodeId, label: `${app.role}`, group: 'application', title: app.status });
          
          if (app.company) {
             if (!companyNodesMap[app.company]) {
                const compNodeId = `company-${app.company}`;
                companyNodesMap[app.company] = compNodeId;
                nodes.push({ id: compNodeId, label: app.company, group: 'company' });
             }
             edges.push({ from: appNodeId, to: companyNodesMap[app.company], dashes: true });
          }
        }
        edges.push({ from: contactNodeId, to: appNodesMap[app._id] });
      }
    });

    res.json({ nodes, edges });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchContacts = async (req, res) => {
  try {
    const { company } = req.query;
    if (!company) {
      return res.status(400).json({ message: 'Company is required' });
    }

    // Mock dataset for suggestions based on company
    // In a real scenario, this might query an external API or a 'Companies' dataset.
    const suggestions = [
      { name: `University Recruiter at ${company}`, role: 'University Recruiter' },
      { name: `Senior Engineer at ${company}`, role: 'Senior Software Engineer' },
      { name: `Alumni at ${company}`, role: 'Software Engineer' }
    ];

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to search contacts' });
  }
};

module.exports = {
  getContacts,
  addContact,
  updateContact,
  deleteContact,
  getNetworkGraph,
  searchContacts
};
