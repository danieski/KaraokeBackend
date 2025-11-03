using Dapper;
using KaraokeBackend.Models;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace KaraokeBackend.Services
{
    // Simplified QueueService: uses configuration for connection string and implements IQueueService
    public class QueueService : IQueueService
    {
        private readonly string _connectionString;

        public QueueService(IConfiguration config)
        {
            // Allow overriding connection string via configuration. Default to a local file.
            _connectionString = config.GetValue<string>("Queue:ConnectionString") ?? "Data Source=queue.db";

            using var db = new SqliteConnection(_connectionString);
            db.Execute(@"CREATE TABLE IF NOT EXISTS queue (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                VideoId TEXT,
                Title TEXT,
                User TEXT,
                Status TEXT
            )");
        }

        public IEnumerable<QueueItem> GetPending()
        {
            using var db = new SqliteConnection(_connectionString);
            return db.Query<QueueItem>("SELECT * FROM queue WHERE Status='pending' ORDER BY Id ASC");
        }

        public void Add(QueueItem item)
        {
            item.Status = "pending";
            using var db = new SqliteConnection(_connectionString);
            db.Execute("INSERT INTO queue (VideoId, Title, User, Status) VALUES (@VideoId, @Title, @User, @Status)", item);
        }

        public void MarkNextPlayed()
        {
            using var db = new SqliteConnection(_connectionString);
            db.Execute("UPDATE queue SET Status='played' WHERE Id = (SELECT Id FROM queue WHERE status='pending' ORDER BY Id ASC LIMIT 1)");
        }
    }
}
