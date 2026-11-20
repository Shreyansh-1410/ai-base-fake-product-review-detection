import logging
from pymongo import MongoClient
import mongomock
from app.config import settings

logger = logging.getLogger("reviewguard.database")

class Database:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mock = False
        self._init_connection()

    def _init_connection(self):
        try:
            # Attempt to connect to real MongoDB with short timeout
            real_client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=1500)
            real_client.server_info()  # Will raise ServerSelectionTimeoutError if not reachable
            self.client = real_client
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = False
            logger.info("Connected successfully to Live MongoDB database: %s", settings.DATABASE_NAME)
        except Exception as e:
            logger.warning(
                "Live MongoDB not reachable (%s). Falling back to resilient In-Memory MongoDB (mongomock). "
                "All operations will persist during session runtime.", str(e)
            )
            self.client = mongomock.MongoClient()
            self.db = self.client[settings.DATABASE_NAME]
            self.is_mock = True

    def get_collection(self, collection_name: str):
        return self.db[collection_name]

    @property
    def products(self):
        return self.db["products"]

    @property
    def reviews(self):
        return self.db["reviews"]

    @property
    def predictions(self):
        return self.db["predictions"]

    @property
    def analysis_reports(self):
        return self.db["analysis_reports"]

    @property
    def model_metadata(self):
        return self.db["model_metadata"]

db = Database()
