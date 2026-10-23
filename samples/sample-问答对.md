# MySQL 面试题

**问：什么是事务？**

事务是一组不可分割的 SQL 操作单元，要么全部成功，要么全部失败。

**问：事务的 ACID 特性？**

答：原子性（Atomicity）、一致性（Consistency）、隔离性（Isolation）、持久性（Durability）。

**问：InnoDB 和 MyISAM 的区别？**

答：InnoDB 支持事务和行级锁，MyISAM 不支持事务、只有表级锁，但读取速度较快。
