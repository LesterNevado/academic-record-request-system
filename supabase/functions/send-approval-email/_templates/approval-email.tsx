import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.12';
import * as React from 'npm:react@18.2.0';

interface ApprovalEmailProps {
  studentName: string;
  requestType: string;
  pickupDate: string;
  notes: string | null;
  copies: number;
}

export const ApprovalEmail = ({
  studentName,
  requestType,
  pickupDate,
  notes,
  copies,
}: ApprovalEmailProps) => {
  // Using the provided logo URL
  const logoUrl = 'https://cdn.builder.io/api/v1/image/assets/e3c6b0ec50df45b58e99e24af78e19b0/496ecc137f8c0eeb6c4acc7eae1c9701ab567695346929631763cd049528af73';

  return (
    <Html>
      <Head />
      <Preview>Your Document Request Has Been Approved</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Row style={{ alignItems: 'center' }}>
              <Column style={{ width: '80px' }}>
                <Img
                  src={logoUrl}
                  alt="NEU Logo"
                  width="70"
                  height="70"
                  style={logo}
                />
              </Column>
              <Column>
                <Heading as="h1" style={mainTitle}>
                  NEU ARRS
                </Heading>
                <Text style={subtitle}>Academic Record Request System</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={divider} />
          
          <Section style={contentSection}>
            <Heading as="h2" style={heading}>
              Document Request Approved
            </Heading>
            
            <Text style={paragraph}>
              Hi {studentName},
            </Text>
            
            <Text style={paragraph}>
              Good news! Your document request has been approved and is scheduled for pickup.
            </Text>
            
            <Section style={infoBox}>
              <Row>
                <Column style={leftColumn}>
                  <Text style={infoLabel}>DOCUMENT TYPE:</Text>
                </Column>
                <Column style={rightColumn}>
                  <Text style={infoValue}>{requestType}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={leftColumn}>
                  <Text style={infoLabel}>NUMBER OF COPIES:</Text>
                </Column>
                <Column style={rightColumn}>
                  <Text style={infoValue}>{copies}</Text>
                </Column>
              </Row>
              <Row>
                <Column style={leftColumn}>
                  <Text style={infoLabel}>PICKUP DATE:</Text>
                </Column>
                <Column style={rightColumn}>
                  <Text style={infoValue}>{pickupDate}</Text>
                </Column>
              </Row>
              {notes && (
                <Row>
                  <Column style={leftColumn}>
                    <Text style={infoLabel}>NOTES:</Text>
                  </Column>
                  <Column style={rightColumn}>
                    <Text style={infoValue}>{notes || 'None'}</Text>
                  </Column>
                </Row>
              )}
            </Section>

            <Text style={paragraph}>
              Please bring your ID for verification when you come to pick up your documents.
            </Text>
            
            <Text style={highlightText}>
              Claim your documents at room #207 (temporary only).
            </Text>
            
            <Text style={highlightText}>
              For Statement of Account (SOA), please proceed at the Accounting Office (Room 202).
            </Text>
            
            <Text style={paragraph}>
              If you have any questions or need to reschedule, please contact the Admission, Scholarship and Financial Assistance Office.
            </Text>
            
            <Hr style={divider} />
            
            <Text style={footerText}>
              This is an automated email. Please do not reply to this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ApprovalEmail;

// Styles
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  width: '100%',
  maxWidth: '600px',
};

const headerSection = {
  backgroundColor: '#0047AB',
  padding: '20px',
  textAlign: 'left' as const,
  borderRadius: '4px 4px 0 0',
};

const logo = {
  margin: '0',
  padding: '0',
};

const mainTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.3',
  textAlign: 'left' as const,
};

const subtitle = {
  color: '#ffffff',
  fontSize: '16px',
  margin: '5px 0 0',
  textAlign: 'left' as const,
};

const contentSection = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '0 0 4px 4px',
};

const heading = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#333',
  margin: '0 0 20px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.5',
  color: '#444',
  margin: '0 0 15px',
};

const highlightText = {
  fontSize: '16px',
  lineHeight: '1.5',
  fontWeight: 'bold',
  color: '#0047AB',
  margin: '0 0 15px',
};

const divider = {
  borderColor: '#e6e6e6',
  margin: '20px 0',
};

const infoBox = {
  backgroundColor: '#f9f9f9',
  borderRadius: '4px',
  borderLeft: '4px solid #0047AB',
  padding: '15px',
  margin: '20px 0',
};

const leftColumn = {
  width: '40%',
  verticalAlign: 'top',
};

const rightColumn = {
  width: '60%',
  verticalAlign: 'top',
};

const infoLabel = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#666',
  margin: '5px 0',
  textAlign: 'left' as const,
};

const infoValue = {
  fontSize: '14px',
  fontWeight: 'normal',
  color: '#333',
  margin: '5px 0',
  textAlign: 'left' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#777',
  fontStyle: 'italic',
  textAlign: 'center' as const,
  margin: '20px 0 0',
};
