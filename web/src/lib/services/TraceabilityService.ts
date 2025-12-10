"use client";

import { Web3Service } from "./Web3Service";
import { LifecycleStep, LifecycleStepDetails, NetbookReport } from "../types";

/**
 * @description Service class for handling traceability-related operations.
 * This service abstracts the interaction with the Web3Service for traceability-specific logic.
 */
export class TraceabilityService {
  private web3Service: Web3Service;

  constructor(web3Service: Web3Service) {
    this.web3Service = web3Service;
  }

  /**
   * @description Registers a batch of netbooks.
   * @param serialNumbers Array of serial numbers.
   * @param batchIds Array of batch IDs.
   * @param modelSpecs Array of model specifications.
   * @returns Transaction hash.
   */
  async registerNetbooks(
    serialNumbers: string[],
    batchIds: string[],
    modelSpecs: string[]
  ): Promise<string> {
    try {
      return await this.web3Service.registerNetbooks(serialNumbers, batchIds, modelSpecs);
    } catch (error) {
      console.error("Error registering netbooks:", error);
      throw error;
    }
  }

  /**
   * @description Audits the hardware of a netbook.
   * @param serialNumber The netbook's serial number.
   * @param integrityPassed Whether the hardware integrity passed.
   * @param reportHash The hash of the audit report.
   * @returns Transaction hash.
   */
  async auditHardware(
    serialNumber: string,
    integrityPassed: boolean,
    reportHash: string
  ): Promise<string> {
    try {
      return await this.web3Service.auditHardware(serialNumber, integrityPassed, reportHash);
    } catch (error) {
      console.error("Error auditing hardware:", error);
      throw error;
    }
  }

  /**
   * @description Validates the software of a netbook.
   * @param serialNumber The netbook's serial number.
   * @param osVersion The OS version installed.
   * @param validationPassed Whether the software validation passed.
   * @returns Transaction hash.
   */
  async validateSoftware(
    serialNumber: string,
    osVersion: string,
    validationPassed: boolean
  ): Promise<string> {
    try {
      return await this.web3Service.validateSoftware(serialNumber, osVersion, validationPassed);
    } catch (error) {
      console.error("Error validating software:", error);
      throw error;
    }
  }

  /**
   * @description Assigns a netbook to a student.
   * @param serialNumber The netbook's serial number.
   * @param schoolHash The hash of the school.
   * @param studentHash The hash of the student ID.
   * @returns Transaction hash.
   */
  async assignToStudent(
    serialNumber: string,
    schoolHash: string,
    studentHash: string
  ): Promise<string> {
    try {
      return await this.web3Service.assignToStudent(serialNumber, schoolHash, studentHash);
    } catch (error) {
      console.error("Error assigning netbook to student:", error);
      throw error;
    }
  }

  /**
   * @description Fetches the full report of a netbook.
   * @param serialNumber The netbook's serial number.
   * @returns The netbook report with state mapped to LifecycleStep.
   */
  async fetchNetbookReport(serialNumber: string): Promise<NetbookReport> {
    try {
      const report = await this.web3Service.fetchNetbookReport(serialNumber);
      // Validar que el estado sea un LifecycleStep válido
      if (!Object.values(LifecycleStep).includes(report.state as LifecycleStep)) {
        throw new Error("Invalid netbook state received from contract");
      }
      return report;
    } catch (error) {
      console.error("Error fetching netbook report:", error);
      throw error;
    }
  }

  /**
   * @description Fetches the current lifecycle step of a netbook.
   * @param serialNumber The netbook's serial number.
   * @returns The lifecycle step.
   */
  async fetchNetbookLifecycleStep(serialNumber: string): Promise<LifecycleStep> {
    try {
      return await this.web3Service.fetchNetbookLifecycleStep(serialNumber);
    } catch (error) {
      console.error("Error fetching netbook lifecycle step:", error);
      throw error;
    }
  }

  /**
   * @description Gets detailed information for a specific lifecycle step.
   * @param serialNumber The netbook's serial number.
   * @param step The lifecycle step to get details for.
   * @returns Details for the lifecycle step.
   */
  async getLifecycleStepDetails(
    serialNumber: string,
    step: LifecycleStep
  ): Promise<LifecycleStepDetails> {
    try {
      const report = await this.fetchNetbookReport(serialNumber);
      const details: LifecycleStepDetails = {
        label: LifecycleStep[step],
        description: this.getStepDescription(step),
      };

      switch (step) {
        case LifecycleStep.Registered:
          details.timestamp = this.formatTimestamp(report.distributionTimestamp);
          break;
        case LifecycleStep.HardwareAudited:
          details.auditor = report.hwAuditor;
          details.auditResult = report.hwIntegrityPassed ? "Passed" : "Failed";
          break;
        case LifecycleStep.SoftwareValidated:
          details.technician = report.swTechnician;
          details.osVersion = report.osVersion;
          details.validationResult = report.swValidationPassed ? "Passed" : "Failed";
          break;
        case LifecycleStep.Delivered:
          details.school = report.destinationSchoolHash;
          details.studentId = report.studentIdHash;
          details.timestamp = this.formatTimestamp(report.distributionTimestamp);
          break;
      }

      return details;
    } catch (error) {
      console.error("Error getting lifecycle step details:", error);
      throw error;
    }
  }

  /**
   * @description Formats a timestamp from BigInt to a readable string.
   * @param timestamp The timestamp as a string (from BigInt).
   * @returns Formatted timestamp or "N/A" if invalid.
   */
  private formatTimestamp(timestamp: string): string {
    try {
      if (!timestamp || timestamp === "0") return "N/A";
      const date = new Date(Number(timestamp) * 1000);
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "N/A";
    }
  }

  /**
   * @description Gets a description for a lifecycle step.
   * @param step The lifecycle step.
   * @returns A description for the step.
   */
  private getStepDescription(step: LifecycleStep): string {
    switch (step) {
      case LifecycleStep.Registered:
        return "Netbook registered in the system by the manufacturer.";
      case LifecycleStep.HardwareAudited:
        return "Hardware audit completed by the auditor.";
      case LifecycleStep.SoftwareValidated:
        return "Software validation completed by the technician.";
      case LifecycleStep.Delivered:
        return "Netbook delivered to the student.";
      default:
        return "Unknown step.";
    }
  }
}
