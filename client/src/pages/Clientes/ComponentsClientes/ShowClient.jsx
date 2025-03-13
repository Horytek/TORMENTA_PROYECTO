import { 
  FaEye, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaUser, 
  FaBuilding, 
  FaFileAlt, 
  FaClock 
} from "react-icons/fa"
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Avatar, Badge, Card, CardBody, CardHeader, Tabs, Tab } from "@nextui-org/react"
import { useState } from "react"

const getDocumentType = (documentNumber) => {
  return documentNumber?.length === 11 ? 'RUC' : 'DNI';
};

const ViewClientModal = ({ client }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState("details")

  if (!client) return null

  return (
    <>
    <Button 
      isIconOnly 
      variant="light" 
      onPress={() => setIsOpen(true)}
      className="text-blue-500 hover:text-blue-500"
    >
      <FaEye className="h-6 w-4" />
    </Button>
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-start gap-4">
            <Avatar
              size="lg"
              icon={client.type === "personal" ? 
                <FaUser className="h-8 w-8"/> : 
                <FaBuilding className="h-8 w-8"/>
              }
            />
            <div>
              <h2 className="text-2xl font-bold">{client.name}</h2>
              <div className="flex items-center gap-2 text-default-500">
                <FaFileAlt className="h-4 w-4" />
                <span>
                  {getDocumentType(client.documentNumber)}: {client.documentNumber}
                </span>
                <Badge 
                  color={client.status === "active" ? "success" : "danger"}
                  variant="flat"
                >
                  {client.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </ModalHeader>

          <ModalBody className="py-6">
            <Tabs 
              selectedKey={selectedTab}
              onSelectionChange={setSelectedTab}
              aria-label="Client tabs"
            >
              <Tab key="details" title="Detalles">
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <Card>
                    <CardHeader className="pb-0">
                      <h4 className="text-lg font-bold">Información de contacto</h4>
                    </CardHeader>
                    <CardBody className="gap-4">
                      {(!client.address && !client.email && !client.phone) ? (
                        <div className="text-align text-default-500 py-2">
                          No hay información de contacto disponible
                        </div>
                      ) : (
                        <>
                          {client.address && (
                            <div className="flex items-center gap-2">
                              <FaMapMarkerAlt className="h-4 w-4 text-default-500" />
                              <span>{client.address}</span>
                            </div>
                          )}
                          {client.email && (
                            <div className="flex items-center gap-2">
                              <FaEnvelope className="h-4 w-4 text-default-500" />
                              <span>{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <FaPhone className="h-4 w-4 text-default-500" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                        </>
                      )}
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader className="pb-0">
                      <h4 className="text-lg font-bold">Información adicional</h4>
                    </CardHeader>
                    <CardBody className="gap-4">
                      <div className="flex items-center gap-2">
                        <FaClock className="h-4 w-4 text-default-500" />
                        <span>Cliente desde: {new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                      {client.lastPurchase && (
                        <div className="flex items-center gap-2">
                          <FaFileAlt className="h-4 w-4 text-default-500" />
                          <span>Última compra: {new Date(client.lastPurchase).toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                </div>
              </Tab>

              <Tab key="purchases" title="Compras">
                <Card className="mt-4">
                  <CardHeader className="pb-0">
                    <h4 className="text-lg font-bold">Historial de compras</h4>
                    <p className="text-default-500 ml-2">Últimas transacciones realizadas</p>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center text-default-500 py-8">
                      No hay compras registradas
                    </div>
                  </CardBody>
                </Card>
              </Tab>

              <Tab key="history" title="Historial">
                <Card className="mt-4">
                  <CardHeader className="pb-0">
                    <h4 className="text-lg font-bold">Historial de cambios</h4>
                    <p className="text-default-500 ml-2">Registro de modificaciones</p>
                  </CardHeader>
                  <CardBody>
                    <div className="text-center text-default-500 py-8">
                      No hay cambios registrados
                    </div>
                  </CardBody>
                </Card>
              </Tab>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ViewClientModal